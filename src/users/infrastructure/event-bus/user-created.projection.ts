import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCreatedEvent } from '../../domain';
import { UserReadSchema } from '../persistence/mongoose/schemas/user-read.schema';

@Injectable()
export class UserCreatedProjection {
  private readonly logger = new Logger(UserCreatedProjection.name);

  constructor(
    @InjectModel(UserReadSchema.name, 'readConnection')
    private readonly readModel: Model<UserReadSchema>,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    try {
    const { aggregateId, eventData } = event;

      // Verificar se já existe (idempotência)
      const existing = await this.readModel.findById(aggregateId).exec();
      if (existing) {
        this.logger.warn(
          `User ${aggregateId} already exists in read database, skipping projection`,
        );
        return;
    }

    const userData = {
      _id: aggregateId,
      fullName: eventData.fullName,
      email: eventData.email,
        // Senha não é copiada para o read database por segurança
      createdAt: eventData.createdAt,
      updatedAt: eventData.createdAt,
    };

    await this.readModel.create(userData);
      this.logger.log(`User ${aggregateId} projected to read database`);
    } catch (error) {
      this.logger.error(`Error projecting UserCreatedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
