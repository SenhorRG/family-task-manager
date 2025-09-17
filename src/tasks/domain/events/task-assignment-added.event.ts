import { BaseEvent } from '../../../shared/domain/value-objects';

export class TaskAssignmentAddedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      assignedTo: string;
      assignedBy: string;
      assignedAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Task', eventData, version);
  }
}
