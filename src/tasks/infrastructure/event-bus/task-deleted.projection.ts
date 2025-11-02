import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskDeletedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskDeletedProjection {
  private readonly logger = new Logger(TaskDeletedProjection.name);

  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskDeletedEvent): Promise<void> {
    try {
      const { aggregateId } = event;

      const task = await this.readModel.findById(aggregateId).exec();
      if (!task) {
        this.logger.warn(`Task ${aggregateId} not found in read database, skipping delete projection`);
        return;
      }

      await this.readModel.findByIdAndDelete(aggregateId);
      this.logger.log(`Task ${aggregateId} deleted from read database`);
    } catch (error) {
      this.logger.error(`Error projecting TaskDeletedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}

