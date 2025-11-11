import { BaseEvent, EventPayload } from '../../../shared/domain/value-objects';

export interface TaskAssignmentRemovedEventData extends EventPayload {
  assignedTo: string;
  removedBy: string;
  removedAt: Date;
}

export class TaskAssignmentRemovedEvent extends BaseEvent<TaskAssignmentRemovedEventData> {
  constructor(aggregateId: string, eventData: TaskAssignmentRemovedEventData, version: number = 1) {
    super(aggregateId, 'Task', eventData, version);
  }
}
