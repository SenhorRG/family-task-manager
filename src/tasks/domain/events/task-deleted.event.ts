import { BaseEvent } from '../../../shared/domain/value-objects';

export class TaskDeletedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      title: string;
      familyId: string;
      deletedAt: Date;
    },
    version: number,
  ) {
    super(aggregateId, 'Task', eventData, version);
  }
}

