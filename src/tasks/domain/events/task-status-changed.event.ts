import { BaseEvent } from '../../../shared/domain/value-objects';

export class TaskStatusChangedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      oldStatus: string;
      newStatus: string;
      changedBy: string;
      changedAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Task', eventData, version);
  }
}
