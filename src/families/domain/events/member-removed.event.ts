import { BaseEvent } from '../../../shared';

export class MemberRemovedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      userId: string;
      removedBy: string;
      removedAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Family', eventData, version);
  }
}
