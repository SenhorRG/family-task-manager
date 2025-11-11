import { BaseEvent, EventPayload } from '../../../shared';

export interface MemberRoleChangedEventData extends EventPayload {
  userId: string;
  oldRole: string;
  oldResponsibility: string;
  newRole: string;
  newResponsibility: string;
  changedBy: string;
  changedAt: Date;
}

export class MemberRoleChangedEvent extends BaseEvent<MemberRoleChangedEventData> {
  constructor(aggregateId: string, eventData: MemberRoleChangedEventData, version: number = 1) {
    super(aggregateId, 'Family', eventData, version);
  }
}
