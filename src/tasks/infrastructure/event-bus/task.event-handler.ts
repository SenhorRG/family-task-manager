import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskStatusChangedEvent,
  TaskAssignmentAddedEvent,
  TaskAssignmentRemovedEvent,
} from '../../domain/events';
import { TaskCreatedProjection } from './task-created.projection';
import { TaskUpdatedProjection } from './task-updated.projection';
import { TaskStatusChangedProjection } from './task-status-changed.projection';
import { TaskAssignmentAddedProjection } from './task-assignment-added.projection';
import { TaskAssignmentRemovedProjection } from './task-assignment-removed.projection';

@Injectable()
@EventsHandler(TaskCreatedEvent)
export class TaskCreatedEventHandler implements IEventHandler<TaskCreatedEvent> {
  constructor(private readonly taskCreatedProjection: TaskCreatedProjection) {}

  async handle(event: TaskCreatedEvent): Promise<void> {
    await this.taskCreatedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(TaskUpdatedEvent)
export class TaskUpdatedEventHandler implements IEventHandler<TaskUpdatedEvent> {
  constructor(private readonly taskUpdatedProjection: TaskUpdatedProjection) {}

  async handle(event: TaskUpdatedEvent): Promise<void> {
    await this.taskUpdatedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(TaskStatusChangedEvent)
export class TaskStatusChangedEventHandler implements IEventHandler<TaskStatusChangedEvent> {
  constructor(private readonly taskStatusChangedProjection: TaskStatusChangedProjection) {}

  async handle(event: TaskStatusChangedEvent): Promise<void> {
    await this.taskStatusChangedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(TaskAssignmentAddedEvent)
export class TaskAssignmentAddedEventHandler implements IEventHandler<TaskAssignmentAddedEvent> {
  constructor(private readonly taskAssignmentAddedProjection: TaskAssignmentAddedProjection) {}

  async handle(event: TaskAssignmentAddedEvent): Promise<void> {
    await this.taskAssignmentAddedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(TaskAssignmentRemovedEvent)
export class TaskAssignmentRemovedEventHandler
  implements IEventHandler<TaskAssignmentRemovedEvent>
{
  constructor(private readonly taskAssignmentRemovedProjection: TaskAssignmentRemovedProjection) {}

  async handle(event: TaskAssignmentRemovedEvent): Promise<void> {
    await this.taskAssignmentRemovedProjection.handle(event);
  }
}
