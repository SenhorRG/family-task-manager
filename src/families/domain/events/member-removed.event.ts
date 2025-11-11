import { BaseEvent, EventPayload } from '../../../shared';

export interface MemberRemovedEventData extends EventPayload {
  userId: string;
  removedBy: string;
  removedAt: Date;
}

export class MemberRemovedEvent extends BaseEvent<MemberRemovedEventData> {
  constructor(aggregateId: string, eventData: MemberRemovedEventData, version: number = 1) {
    super(aggregateId, 'Family', eventData, version);
  }
}
