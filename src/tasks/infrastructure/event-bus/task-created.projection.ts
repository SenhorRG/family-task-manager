import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskCreatedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskCreatedProjection {
  private readonly logger = new Logger(TaskCreatedProjection.name);

  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskCreatedEvent): Promise<void> {
    try {
      const { aggregateId, eventData } = event;

      const existing = await this.readModel.findById(aggregateId).exec();
      if (existing) {
        this.logger.warn(
          `Task ${aggregateId} already exists in read database, skipping projection`,
        );
        return;
      }

      const taskData = {
        _id: aggregateId,
        title: eventData.title,
        description: eventData.description,
        familyId: eventData.familyId,
        assignments: eventData.assignedTo.map((userId) => ({
          assignedTo: userId,
          assignedBy: eventData.assignedBy,
          assignedAt: eventData.createdAt,
        })),
        status: 'PENDING',
        createdBy: eventData.assignedBy,
        dueDate: eventData.dueDate,
        location: eventData.location,
        createdAt: eventData.createdAt,
        updatedAt: eventData.createdAt,
      };

      await this.readModel.create(taskData);
      this.logger.log(`Task ${aggregateId} projected to read database`);
    } catch (error) {
      this.logger.error(`Error projecting TaskCreatedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
