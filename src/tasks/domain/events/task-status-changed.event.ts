import { BaseEvent, EventPayload } from '../../../shared/domain/value-objects';

export interface TaskStatusChangedEventData extends EventPayload {
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: Date;
}

export class TaskStatusChangedEvent extends BaseEvent<TaskStatusChangedEventData> {
  constructor(aggregateId: string, eventData: TaskStatusChangedEventData, version: number = 1) {
    super(aggregateId, 'Task', eventData, version);
  }
}
