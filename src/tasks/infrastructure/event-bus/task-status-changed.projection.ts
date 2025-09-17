import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskStatusChangedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskStatusChangedProjection {
  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskStatusChangedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    await this.readModel.findByIdAndUpdate(aggregateId, {
      status: eventData.newStatus,
      updatedAt: eventData.changedAt,
    });
  }
}
