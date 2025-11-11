import { BaseEvent, EventPayload } from '../../../shared';

export interface UserCreatedEventData extends EventPayload {
  fullName: string;
  email: string;
  createdAt: Date;
}

export class UserCreatedEvent extends BaseEvent<UserCreatedEventData> {
  constructor(aggregateId: string, eventData: UserCreatedEventData, version: number = 1) {
    super(aggregateId, 'User', eventData, version);
  }
}
