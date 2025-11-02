import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseEvent } from '../../../shared';
import { TaskFactory } from '../../domain/services';
import { Task } from '../../domain/aggregates';
import { TaskSchema } from '../../infrastructure/persistence/mongoose/schemas';
import { AggregateRehydrator } from '../../../shared/application/services/aggregate-rehydration.service';

/**
 * Adapter que implementa AggregateRehydrator para Task
 */
@Injectable()
export class TaskRehydratorAdapter implements AggregateRehydrator<Task> {
  constructor(
    private readonly taskFactory: TaskFactory,
    @InjectModel(TaskSchema.name, 'writeConnection')
    private readonly writeModel: Model<TaskSchema>,
  ) {}

  getAggregateType(): string {
    return 'Task';
  }

  async checkExists(aggregateId: string): Promise<boolean> {
    const exists = await this.writeModel.findById(aggregateId).exec();
    return !!exists;
  }

  async rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<Task> {
    return this.taskFactory.reconstructTaskFromEvents(aggregateId, events);
  }

  async saveWithoutEvents(task: Task): Promise<void> {
    const taskData = {
      _id: task.taskId.value,
      title: task.title.value,
      description: task.description.value,
      familyId: task.familyId.value,
      assignments: task.assignments.map((assignment) => ({
        assignedTo: assignment.assignedTo.value,
        assignedBy: assignment.assignedBy.value,
        assignedAt: assignment.assignedAt,
      })),
      status: task.status.value,
      createdBy: task.createdBy.value,
      dueDate: task.dueDate,
      location: task.location.hasLocation() ? task.location.value : undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    await this.writeModel.findByIdAndUpdate(task.taskId.value, taskData, {
      upsert: true,
      new: true,
    });
  }
}

