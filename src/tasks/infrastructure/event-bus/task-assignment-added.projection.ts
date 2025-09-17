import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskAssignmentAddedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskAssignmentAddedProjection {
  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskAssignmentAddedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    await this.readModel.findByIdAndUpdate(aggregateId, {
      $push: {
        assignments: {
          assignedTo: eventData.assignedTo,
          assignedBy: eventData.assignedBy,
          assignedAt: eventData.assignedAt,
        },
      },
      $set: {
        updatedAt: eventData.assignedAt,
      },
    });
  }
}
