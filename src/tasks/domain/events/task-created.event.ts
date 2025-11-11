import { BaseEvent, EventPayload } from '../../../shared/domain/value-objects';

export interface TaskCreatedEventData extends EventPayload {
  title: string;
  description: string;
  familyId: string;
  assignedTo: string[];
  assignedBy: string;
  dueDate?: Date;
  location?: string;
  createdAt: Date;
}

export class TaskCreatedEvent extends BaseEvent<TaskCreatedEventData> {
  constructor(aggregateId: string, eventData: TaskCreatedEventData, version: number = 1) {
    super(aggregateId, 'Task', eventData, version);
  }
}
