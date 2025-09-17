import { BaseEvent } from '../../../shared';

export class FamilyCreatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      name: string;
      principalResponsibleUserId: string;
      principalRole: string;
      createdAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Family', eventData, version);
  }
}
