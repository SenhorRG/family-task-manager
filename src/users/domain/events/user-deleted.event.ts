import { BaseEvent } from '../../../shared';

export class UserDeletedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      fullName: string;
      email: string;
      deletedAt: Date;
    },
    version: number,
  ) {
    super(aggregateId, 'User', eventData, version);
  }
}

