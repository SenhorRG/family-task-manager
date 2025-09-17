import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskAssignmentRemovedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskAssignmentRemovedProjection {
  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskAssignmentRemovedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    await this.readModel.findByIdAndUpdate(aggregateId, {
      $pull: {
        assignments: {
          assignedTo: eventData.assignedTo,
        },
      },
      $set: {
        updatedAt: eventData.removedAt,
      },
    });
  }
}
