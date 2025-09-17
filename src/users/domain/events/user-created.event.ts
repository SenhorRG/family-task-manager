import { BaseEvent } from '../../../shared';

export class UserCreatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      fullName: string;
      email: string;
      createdAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'User', eventData, version);
  }
}
