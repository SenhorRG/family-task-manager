import { BaseEvent, EventPayload } from '../../../shared';

export interface FamilyCreatedEventData extends EventPayload {
  name: string;
  principalResponsibleUserId: string;
  principalRole: string;
  createdAt: Date;
}

export class FamilyCreatedEvent extends BaseEvent<FamilyCreatedEventData> {
  constructor(aggregateId: string, eventData: FamilyCreatedEventData, version: number = 1) {
    super(aggregateId, 'Family', eventData, version);
  }
}
