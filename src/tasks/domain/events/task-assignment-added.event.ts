import { BaseEvent, EventPayload } from '../../../shared/domain/value-objects';

export interface TaskAssignmentAddedEventData extends EventPayload {
  assignedTo: string;
  assignedBy: string;
  assignedAt: Date;
}

export class TaskAssignmentAddedEvent extends BaseEvent<TaskAssignmentAddedEventData> {
  constructor(aggregateId: string, eventData: TaskAssignmentAddedEventData, version: number = 1) {
    super(aggregateId, 'Task', eventData, version);
  }
}
