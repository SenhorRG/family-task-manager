import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { RehydrateAggregateCommand } from './rehydrate-aggregate.command';
import { UserRehydratorAdapter } from '../../../../users/application/services';
import { FamilyRehydratorAdapter } from '../../../../families/application/services';
import { TaskRehydratorAdapter } from '../../../../tasks/application/services';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';

@CommandHandler(RehydrateAggregateCommand)
export class RehydrateAggregateHandler implements ICommandHandler<RehydrateAggregateCommand> {
  private readonly logger = new Logger(RehydrateAggregateHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly userRehydrator: UserRehydratorAdapter,
    private readonly familyRehydrator: FamilyRehydratorAdapter,
    private readonly taskRehydrator: TaskRehydratorAdapter,
  ) {}

  async execute(command: RehydrateAggregateCommand): Promise<any> {
    this.logger.log(
      `🔄 Executando rehydratação para ${command.aggregateType} ${command.aggregateId}...`,
    );

    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    // Selecionar rehydrator baseado no tipo
    let rehydrator;
    switch (command.aggregateType.toUpperCase()) {
      case 'USER':
        rehydrator = this.userRehydrator;
        break;
      case 'FAMILY':
        rehydrator = this.familyRehydrator;
        break;
      case 'TASK':
        rehydrator = this.taskRehydrator;
        break;
      default:
        throw new Error(`Invalid aggregate type: ${command.aggregateType}. Use USER, FAMILY, or TASK`);
    }

    try {
      // Verificar se já existe
      const exists = await rehydrator.checkExists(command.aggregateId);
      if (exists) {
        this.logger.warn(
          `${command.aggregateType} ${command.aggregateId} already exists, skipping rehydration`,
        );
        return {
          success: true,
          message: `Aggregate ${command.aggregateId} already exists`,
        };
      }

      // Obter eventos
      const events = await this.eventStore.getEvents(command.aggregateId);
      if (events.length === 0) {
        throw new Error(`No events found for ${command.aggregateType} ${command.aggregateId}`);
      }

      // Verificar tipo do aggregate
      const firstEvent = events[0];
      if (firstEvent.aggregateType !== command.aggregateType) {
        throw new Error(
          `Event aggregate type mismatch. Expected ${command.aggregateType}, got ${firstEvent.aggregateType}`,
        );
      }

      // Reconstruir aggregate
      const aggregate = await rehydrator.rehydrateAggregate(command.aggregateId, events);

      // Salvar sem eventos
      await rehydrator.saveWithoutEvents(aggregate);

      this.logger.log(`✅ ${command.aggregateType} ${command.aggregateId} successfully rehydrated`);

      return {
        success: true,
        message: `Aggregate ${command.aggregateId} rehydrated successfully`,
      };
    } catch (error) {
      this.logger.error(
        `Error rehydrating ${command.aggregateType} ${command.aggregateId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
