import { BaseEvent } from '../../../shared';

export class MemberAddedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      userId: string;
      role: string;
      responsibility: string;
      addedBy: string;
      addedAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Family', eventData, version);
  }
}
