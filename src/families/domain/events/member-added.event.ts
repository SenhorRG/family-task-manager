import { BaseEvent, EventPayload } from '../../../shared';

export interface MemberAddedEventData extends EventPayload {
  userId: string;
  role: string;
  responsibility: string;
  addedBy: string;
  addedAt: Date;
}

export class MemberAddedEvent extends BaseEvent<MemberAddedEventData> {
  constructor(aggregateId: string, eventData: MemberAddedEventData, version: number = 1) {
    super(aggregateId, 'Family', eventData, version);
  }
}
