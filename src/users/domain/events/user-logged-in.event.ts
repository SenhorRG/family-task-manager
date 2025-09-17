import { BaseEvent } from '../../../shared';

export class UserLoggedInEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      fullName: string;
      email: string;
      loggedInAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'User', eventData, version);
  }
}
