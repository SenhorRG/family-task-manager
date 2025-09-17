import { BaseEvent } from '../../../shared/domain/value-objects';

export class TaskAssignmentRemovedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      assignedTo: string;
      removedBy: string;
      removedAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Task', eventData, version);
  }
}
