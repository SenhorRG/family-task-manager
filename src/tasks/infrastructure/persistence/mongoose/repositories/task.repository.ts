import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventBus } from '@nestjs/cqrs';
import { TaskRepository } from '../../../../domain/ports';
import { Task } from '../../../../domain/aggregates';
import {
  TaskId,
  TaskTitleVO,
  TaskDescriptionVO,
  TaskLocationVO,
  TaskAssignmentVO,
  TaskStatusVO,
  TaskStatus,
} from '../../../../domain/value-objects';
import { FamilyId } from '../../../../../families/domain/value-objects';
import { UserId } from '../../../../../users/domain/value-objects';
import { TaskDocument, TaskSchema } from '../schemas';
import { EventStore } from '../../../../../shared';

@Injectable()
export class MongoTaskRepository implements TaskRepository {
  constructor(
    @InjectModel(TaskSchema.name, 'writeConnection')
    private readonly writeModel: Model<TaskDocument>,
    @Inject('EventStore')
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus,
  ) {}

  async save(task: Task): Promise<void> {
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
      version: task.version,
    };

    await this.writeModel.findByIdAndUpdate(task.taskId.value, taskData, {
      upsert: true,
      new: true,
    });

    const uncommittedEvents = task.uncommittedEvents;
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(
        task.taskId.value,
        uncommittedEvents,
        task.version - uncommittedEvents.length,
      );

      for (const event of uncommittedEvents) {
        await this.eventBus.publish(event);
      }

      task.markEventsAsCommitted();
    }
  }

  async findById(id: TaskId): Promise<Task | null> {
    const taskDoc = await this.writeModel.findById(id.value).exec();
    if (!taskDoc) {
      return null;
    }

    return this.mapToDomain(taskDoc);
  }

  async findByFamily(familyId: FamilyId): Promise<Task[]> {
    const taskDocs = await this.writeModel.find({ familyId: familyId.value }).exec();
    return taskDocs.map((doc) => this.mapToDomain(doc));
  }

  async findByAssignedTo(userId: UserId): Promise<Task[]> {
    const taskDocs = await this.writeModel
      .find({
        'assignments.assignedTo': userId.value,
      })
      .exec();
    return taskDocs.map((doc) => this.mapToDomain(doc));
  }

  async findByCreatedBy(userId: UserId): Promise<Task[]> {
    const taskDocs = await this.writeModel.find({ createdBy: userId.value }).exec();
    return taskDocs.map((doc) => this.mapToDomain(doc));
  }

  async delete(id: TaskId): Promise<void> {
    await this.writeModel.findByIdAndDelete(id.value);
  }

  private mapToDomain(taskDoc: TaskDocument): Task {
    const taskId = new TaskId(taskDoc._id.toString());
    const taskTitle = new TaskTitleVO(taskDoc.title);
    const taskDescription = new TaskDescriptionVO(taskDoc.description);
    const taskLocation = new TaskLocationVO(taskDoc.location || '');
    const taskStatus = new TaskStatusVO(taskDoc.status as TaskStatus);
    const familyIdVO = new FamilyId(taskDoc.familyId);
    const createdByVO = new UserId(taskDoc.createdBy);

    const taskAssignments = taskDoc.assignments.map(
      (assignment) =>
        new TaskAssignmentVO(
          new UserId(assignment.assignedTo),
          new UserId(assignment.assignedBy),
          assignment.assignedAt,
        ),
    );

    const task = new Task(
      taskId,
      taskTitle,
      taskDescription,
      familyIdVO,
      taskAssignments,
      createdByVO,
      taskStatus,
      taskDoc.dueDate,
      taskLocation,
      taskDoc.createdAt,
      taskDoc.updatedAt,
    );
    task.restoreVersion(taskDoc.version ?? 0);
    return task;
  }
}
