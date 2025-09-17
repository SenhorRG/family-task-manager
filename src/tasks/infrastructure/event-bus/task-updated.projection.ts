import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaskUpdatedEvent } from '../../domain/events';
import { TaskSchema } from '../persistence/mongoose/schemas';

@Injectable()
export class TaskUpdatedProjection {
  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskSchema>,
  ) {}

  async handle(event: TaskUpdatedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    const updateData: any = {
      updatedAt: eventData.updatedAt,
    };

    if (eventData.title) updateData.title = eventData.title;
    if (eventData.description) updateData.description = eventData.description;
    if (eventData.dueDate) updateData.dueDate = eventData.dueDate;
    if (eventData.location) updateData.location = eventData.location;

    await this.readModel.findByIdAndUpdate(aggregateId, updateData);
  }
}
