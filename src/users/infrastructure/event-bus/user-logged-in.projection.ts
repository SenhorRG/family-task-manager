import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLoggedInEvent } from '../../domain';
import { UserReadSchema } from '../persistence/mongoose/schemas/user-read.schema';

@Injectable()
export class UserLoggedInProjection {
  private readonly logger = new Logger(UserLoggedInProjection.name);

  constructor(
    @InjectModel(UserReadSchema.name, 'readConnection')
    private readonly readModel: Model<UserReadSchema>,
  ) {}

  async handle(event: UserLoggedInEvent): Promise<void> {
    try {
    const { aggregateId, eventData } = event;

      // Verificar se o usuário existe (idempotência)
      const user = await this.readModel.findById(aggregateId).exec();
      if (!user) {
        this.logger.warn(`User ${aggregateId} not found in read database, skipping login projection`);
        return;
      }

    await this.readModel.findByIdAndUpdate(aggregateId, {
        $set: {
      lastLoginAt: eventData.loggedInAt,
      updatedAt: eventData.loggedInAt,
        },
    });

      this.logger.log(`User ${aggregateId} last login updated`);
    } catch (error) {
      this.logger.error(`Error projecting UserLoggedInEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
