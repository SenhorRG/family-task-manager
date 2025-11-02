import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDeletedEvent } from '../../domain';
import { UserReadSchema } from '../persistence/mongoose/schemas/user-read.schema';

@Injectable()
export class UserDeletedProjection {
  private readonly logger = new Logger(UserDeletedProjection.name);

  constructor(
    @InjectModel(UserReadSchema.name, 'readConnection')
    private readonly readModel: Model<UserReadSchema>,
  ) {}

  async handle(event: UserDeletedEvent): Promise<void> {
    try {
      const { aggregateId } = event;

      const user = await this.readModel.findById(aggregateId).exec();
      if (!user) {
        this.logger.warn(
          `User ${aggregateId} not found in read database, skipping delete projection`,
        );
        return;
      }

      await this.readModel.findByIdAndDelete(aggregateId);
      this.logger.log(`User ${aggregateId} deleted from read database`);
    } catch (error) {
      this.logger.error(`Error projecting UserDeletedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
