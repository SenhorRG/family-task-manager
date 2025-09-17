import { Injectable, Inject } from '@nestjs/common';
import { Task } from '../aggregates';
import {
  TaskId,
  TaskTitleVO,
  TaskDescriptionVO,
  TaskLocationVO,
  TaskAssignmentVO,
  TaskStatusVO,
  TaskStatus,
} from '../value-objects';
import { FamilyId } from '../../../families/domain/value-objects';
import { UserId } from '../../../users/domain/value-objects';
import { IdGenerator } from '../../../shared';

@Injectable()
export class TaskFactory {
  constructor(@Inject('IdGenerator') private readonly idGenerator: IdGenerator) {}

  createTask(
    title: string,
    description: string,
    familyId: string,
    assignedTo: string[],
    assignedBy: string,
    dueDate?: Date,
    location?: string,
  ): Task {
    const taskId = new TaskId(this.idGenerator.generate());
    const taskTitle = new TaskTitleVO(title);
    const taskDescription = new TaskDescriptionVO(description);
    const taskLocation = new TaskLocationVO(location || '');
    const taskStatus = new TaskStatusVO(TaskStatus.PENDING);
    const familyIdVO = new FamilyId(familyId);
    const assignedByVO = new UserId(assignedBy);

    const assignments = assignedTo.map(
      (userId) => new TaskAssignmentVO(new UserId(userId), assignedByVO),
    );

    return new Task(
      taskId,
      taskTitle,
      taskDescription,
      familyIdVO,
      assignments,
      assignedByVO,
      taskStatus,
      dueDate,
      taskLocation,
    );
  }

  createTaskFromPersistence(
    id: string,
    title: string,
    description: string,
    familyId: string,
    assignments: Array<{
      assignedTo: string;
      assignedBy: string;
      assignedAt: Date;
    }>,
    status: string,
    createdBy: string,
    dueDate?: Date,
    location?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ): Task {
    const taskId = new TaskId(id);
    const taskTitle = new TaskTitleVO(title);
    const taskDescription = new TaskDescriptionVO(description);
    const taskLocation = new TaskLocationVO(location || '');
    const taskStatus = new TaskStatusVO(status as TaskStatus);
    const familyIdVO = new FamilyId(familyId);
    const createdByVO = new UserId(createdBy);

    const taskAssignments = assignments.map(
      (assignment) =>
        new TaskAssignmentVO(
          new UserId(assignment.assignedTo),
          new UserId(assignment.assignedBy),
          assignment.assignedAt,
        ),
    );

    return new Task(
      taskId,
      taskTitle,
      taskDescription,
      familyIdVO,
      taskAssignments,
      createdByVO,
      taskStatus,
      dueDate,
      taskLocation,
      createdAt,
      updatedAt,
    );
  }
}
