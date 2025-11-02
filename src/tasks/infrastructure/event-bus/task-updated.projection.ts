import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskUpdatedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskUpdatedProjection {
  private readonly logger = new Logger(TaskUpdatedProjection.name);

  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskUpdatedEvent): Promise<void> {
    try {
      const { aggregateId, eventData } = event;

      const task = await this.readModel.findById(aggregateId).exec();
      if (!task) {
        this.logger.warn(`Task ${aggregateId} not found in read database, skipping projection`);
        return;
      }

      const updateData: any = {
        updatedAt: eventData.updatedAt,
      };

      if (eventData.title) updateData.title = eventData.title;
      if (eventData.description) updateData.description = eventData.description;
      if (eventData.dueDate !== undefined) updateData.dueDate = eventData.dueDate;
      if (eventData.location !== undefined) updateData.location = eventData.location;

      await this.readModel.findByIdAndUpdate(aggregateId, { $set: updateData });
      this.logger.log(`Task ${aggregateId} updated in read database`);
    } catch (error) {
      this.logger.error(`Error projecting TaskUpdatedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
