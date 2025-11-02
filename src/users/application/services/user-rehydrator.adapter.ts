import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseEvent } from '../../../shared';
import { UserFactory } from '../../domain/services';
import { User } from '../../domain/aggregates';
import { UserSchema } from '../../infrastructure/persistence/mongoose/schemas';
import { AggregateRehydrator } from '../../../shared/application/services/aggregate-rehydration.service';
import { PasswordHasher } from '../../../shared';

/**
 * Adapter que implementa AggregateRehydrator para User
 */
@Injectable()
export class UserRehydratorAdapter implements AggregateRehydrator<User> {
  constructor(
    private readonly userFactory: UserFactory,
    @InjectModel(UserSchema.name, 'writeConnection')
    private readonly writeModel: Model<UserSchema>,
    @Inject('PasswordHasher') private readonly passwordHasher: PasswordHasher,
  ) {}

  getAggregateType(): string {
    return 'User';
  }

  async checkExists(aggregateId: string): Promise<boolean> {
    const exists = await this.writeModel.findById(aggregateId).exec();
    return !!exists;
  }

  async rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<User> {
    // Buscar senha do write database (se ainda existir)
    const existing = await this.writeModel.findById(aggregateId).select('password').exec();
    
    let hashedPassword: string;
    
    if (existing) {
      // Se o usuário ainda existe parcialmente, usar a senha dele
      hashedPassword = existing.password;
    } else {
      // Se o usuário foi completamente deletado, gerar uma senha temporária
      // O usuário precisará resetar a senha após a rehydratação
      // Geramos uma senha temporária aleatória e a hasheamos
      const tempPassword = `TEMP_RESET_${aggregateId.substring(0, 8)}_${Date.now()}`;
      hashedPassword = await this.passwordHasher.hash(tempPassword);
      
      // Log para indicar que uma senha temporária foi criada
      console.warn(
        `⚠️ Password not available for user ${aggregateId}. ` +
        `Temporary password generated. User MUST reset password after rehydration.`,
      );
    }

    return this.userFactory.reconstructUserFromEvents(aggregateId, events, hashedPassword);
  }

  async saveWithoutEvents(user: User): Promise<void> {
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
        await this.writeModel.findByIdAndUpdate(user.userId.value, userData, {
          new: true,
        });
      } else {
        throw error;
      }
    }
  }
}

