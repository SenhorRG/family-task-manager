import { Injectable, Inject, Logger } from '@nestjs/common';
import { UserFactory } from '../../domain/services';
import { UserRepository } from '../../domain/ports';
import { User } from '../../domain/aggregates';
import { UserId } from '../../domain/value-objects';
import { EventStore } from '../../../shared';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserSchema } from '../../infrastructure/persistence/mongoose/schemas';

/**
 * Serviço para rehydratar aggregates do Event Store para o Write Database
 * 
 * DIFERENÇA ENTRE REPLAY E REHYDRATION:
 * - REPLAY: Reprocessa eventos → Atualiza Read Database (via projeções)
 * - REHYDRATION: Reconstrói aggregates → Atualiza Write Database (via rehydratação)
 * 
 * A rehydratação é necessária quando o Write Database é perdido ou precisa ser reconstruído,
 * mas os eventos estão intactos no Event Store.
 */
@Injectable()
export class UserRehydrationService {
  private readonly logger = new Logger(UserRehydrationService.name);

  constructor(
    private readonly userFactory: UserFactory,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    @Inject('EventStore') private readonly eventStore: EventStore,
    @InjectModel(UserSchema.name, 'writeConnection')
    private readonly writeModel: Model<UserSchema>,
  ) {}

  /**
   * Rehydrata um User aggregate específico do Event Store para o Write Database
   * @param aggregateId ID do aggregate a ser rehydratado
   */
  async rehydrateUser(aggregateId: string): Promise<void> {
    this.logger.log(`🔄 Starting rehydration for user ${aggregateId}...`);

    try {
      // 1. Verificar se já existe no write database
      const existing = await this.writeModel.findById(aggregateId).exec();
      if (existing) {
        this.logger.warn(`User ${aggregateId} already exists in write database, skipping rehydration`);
        return;
      }

      // 2. Obter todos os eventos do aggregate
      const events = await this.eventStore.getEvents(aggregateId);
      if (events.length === 0) {
        throw new Error(`No events found for user ${aggregateId}`);
      }

      // 3. Obter senha hasheada do Event Store ou do primeiro evento
      // Nota: A senha não está nos eventos por segurança
      // Em um sistema real, você pode:
      // - Ter uma tabela de senhas separada
      // - Ou precisar que o usuário redefina a senha após rehydratação
      // Para este exemplo, vamos buscar do write database se existir, ou usar uma senha padrão
      let hashedPassword: string;
      
      // Tentar buscar do write database primeiro (se foi parcialmente perdido)
      const partialUser = await this.writeModel.findById(aggregateId).select('password').exec();
      if (partialUser) {
        hashedPassword = partialUser.password;
      } else {
        // Se não existe, precisamos de uma estratégia:
        // Opção 1: Gerar senha aleatória (usuário precisará resetar)
        // Opção 2: Falhar e exigir reset de senha
        // Opção 3: Usar uma tabela de backup de senhas
        throw new Error(
          `Cannot rehydrate user ${aggregateId}: password not available. ` +
          `User must reset password after rehydration.`,
        );
      }

      // 4. Reconstruir aggregate a partir dos eventos
      const user = this.userFactory.reconstructUserFromEvents(aggregateId, events, hashedPassword);

      // 5. Salvar no write database SEM emitir novos eventos
      // (os eventos já existem no Event Store)
      await this.saveUserWithoutEvents(user);

      this.logger.log(`✅ User ${aggregateId} successfully rehydrated to write database`);
    } catch (error) {
      this.logger.error(`Error rehydrating user ${aggregateId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Rehydrata todos os Users do Event Store para o Write Database
   */
  async rehydrateAllUsers(): Promise<{
    total: number;
    rehydrated: number;
    skipped: number;
    errors: Array<{ aggregateId: string; error: string }>;
  }> {
    this.logger.log('🔄 Starting rehydration of all users...');

    const result = {
      total: 0,
      rehydrated: 0,
      skipped: 0,
      errors: [] as Array<{ aggregateId: string; error: string }>,
    };

    try {
      // 1. Obter todos os eventos
      const allEvents = await this.eventStore.getAllEvents();

      // 2. Agrupar eventos por aggregateId
      const eventsByAggregate = new Map<string, typeof allEvents>();
      for (const event of allEvents) {
        if (event.aggregateType === 'User') {
          if (!eventsByAggregate.has(event.aggregateId)) {
            eventsByAggregate.set(event.aggregateId, []);
          }
          eventsByAggregate.get(event.aggregateId)!.push(event);
        }
      }

      result.total = eventsByAggregate.size;

      // 3. Rehydratar cada aggregate
      for (const [aggregateId, events] of eventsByAggregate) {
        try {
          // Verificar se já existe
          const existing = await this.writeModel.findById(aggregateId).exec();
          if (existing) {
            result.skipped++;
            this.logger.debug(`User ${aggregateId} already exists, skipping`);
            continue;
          }

          // Para rehydratação completa, precisamos da senha
          // Vamos tentar obter do write database ou falhar com instruções
          const partialUser = await this.writeModel.findById(aggregateId).select('password').exec();
          if (!partialUser) {
            result.errors.push({
              aggregateId,
              error: 'Password not available. User must reset password.',
            });
            continue;
          }

          const user = this.userFactory.reconstructUserFromEvents(
            aggregateId,
            events.sort((a, b) => a.version - b.version),
            partialUser.password,
          );

          await this.saveUserWithoutEvents(user);
          result.rehydrated++;
        } catch (error) {
          result.errors.push({
            aggregateId,
            error: error.message,
          });
          this.logger.error(`Error rehydrating user ${aggregateId}: ${error.message}`);
        }
      }

      this.logger.log(
        `✅ Rehydration completed: ${result.rehydrated}/${result.total} rehydrated, ` +
        `${result.skipped} skipped, ${result.errors.length} errors`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error during rehydration: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Salva o User no Write Database SEM emitir eventos
   * (usado na rehydratação, pois os eventos já existem no Event Store)
   */
  private async saveUserWithoutEvents(user: User): Promise<void> {
    const userData = {
      _id: user.userId.value,
      fullName: user.fullName.value,
      email: user.email.value,
      password: user.password.hashedValue,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    try {
      await this.writeModel.create(userData);
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key - atualizar existente
        await this.writeModel.findByIdAndUpdate(user.userId.value, userData, {
          new: true,
        });
      } else {
        throw error;
      }
    }

    // NÃO salvar eventos no Event Store (já existem)
    // NÃO publicar eventos no Event Bus (já foram processados)
    // NÃO marcar eventos como committed (não há eventos novos)
  }
}

