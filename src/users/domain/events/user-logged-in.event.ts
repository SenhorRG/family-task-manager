import { BaseEvent, EventPayload } from '../../../shared';

export interface UserLoggedInEventData extends EventPayload {
  fullName: string;
  email: string;
  loggedInAt: Date;
}

export class UserLoggedInEvent extends BaseEvent<UserLoggedInEventData> {
  constructor(aggregateId: string, eventData: UserLoggedInEventData, version: number = 1) {
    super(aggregateId, 'User', eventData, version);
  }
}
