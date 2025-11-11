import { BaseEvent, EventPayload } from '../../../shared/domain/value-objects';

export interface TaskUpdatedEventData extends EventPayload {
  title?: string;
  description?: string;
  dueDate?: Date;
  location?: string;
  updatedBy: string;
  updatedAt: Date;
}

export class TaskUpdatedEvent extends BaseEvent<TaskUpdatedEventData> {
  constructor(aggregateId: string, eventData: TaskUpdatedEventData, version: number = 1) {
    super(aggregateId, 'Task', eventData, version);
  }
}
