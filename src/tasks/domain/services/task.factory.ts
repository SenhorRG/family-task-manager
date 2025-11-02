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
import { IdGenerator, BaseEvent } from '../../../shared';
import { TaskCreatedEvent } from '../events';

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

  /**
   * Reconstrói um Task aggregate a partir de eventos (Event Sourcing)
   * @param aggregateId ID do aggregate
   * @param events Lista de eventos ordenados por versão
   * @returns Task aggregate reconstruído
   */
  reconstructTaskFromEvents(aggregateId: string, events: BaseEvent[]): Task {
    if (events.length === 0) {
      throw new Error(`No events found for task ${aggregateId}`);
    }

    // Primeiro evento deve ser TaskCreatedEvent
    const firstEvent = events[0];
    if (!(firstEvent instanceof TaskCreatedEvent)) {
      throw new Error(
        `First event must be TaskCreatedEvent, but got ${firstEvent.eventType}`,
      );
    }

    const taskId = new TaskId(aggregateId);
    const taskTitle = new TaskTitleVO(firstEvent.eventData.title);
    const taskDescription = new TaskDescriptionVO(firstEvent.eventData.description);
    const familyId = new FamilyId(firstEvent.eventData.familyId);
    const createdBy = new UserId(firstEvent.eventData.assignedBy);
    const taskStatus = new TaskStatusVO(TaskStatus.PENDING);
    const taskLocation = new TaskLocationVO(firstEvent.eventData.location || '');

    const assignments = firstEvent.eventData.assignedTo.map(
      (userId) => new TaskAssignmentVO(new UserId(userId), createdBy),
    );

    // Criar Task sem emitir eventos (já passamos createdAt para indicar que não é novo)
    const task = new Task(
      taskId,
      taskTitle,
      taskDescription,
      familyId,
      assignments,
      createdBy,
      taskStatus,
      firstEvent.eventData.dueDate,
      taskLocation.hasLocation() ? taskLocation : undefined,
      firstEvent.eventData.createdAt,
      firstEvent.occurredOn,
    );

    // Carregar eventos restantes (pular o primeiro que já foi aplicado no construtor)
    const remainingEvents = events.slice(1);
    if (remainingEvents.length > 0) {
      task.loadFromHistory(remainingEvents);
    }

    return task;
  }
}
