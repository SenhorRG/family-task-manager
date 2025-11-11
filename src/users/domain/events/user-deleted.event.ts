import { BaseEvent, EventPayload } from '../../../shared';

export interface UserDeletedEventData extends EventPayload {
  fullName: string;
  email: string;
  deletedAt: Date;
}

export class UserDeletedEvent extends BaseEvent<UserDeletedEventData> {
  constructor(aggregateId: string, eventData: UserDeletedEventData, version: number) {
    super(aggregateId, 'User', eventData, version);
  }
}
