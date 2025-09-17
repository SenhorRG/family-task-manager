import { BaseEvent } from '../../../shared';

export class MemberRoleChangedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      userId: string;
      oldRole: string;
      oldResponsibility: string;
      newRole: string;
      newResponsibility: string;
      changedBy: string;
      changedAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Family', eventData, version);
  }
}
