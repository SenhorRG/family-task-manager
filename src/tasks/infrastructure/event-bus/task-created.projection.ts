import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskCreatedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskCreatedProjection {
  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskCreatedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

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
  }
}
