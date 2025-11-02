import { BaseEvent } from '../../../shared';

export class FamilyDeletedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      name: string;
      deletedAt: Date;
    },
    version: number,
  ) {
    super(aggregateId, 'Family', eventData, version);
  }
}

