import { BaseEvent, EventPayload } from '../../../shared';

export interface FamilyDeletedEventData extends EventPayload {
  name: string;
  deletedAt: Date;
}

export class FamilyDeletedEvent extends BaseEvent<FamilyDeletedEventData> {
  constructor(aggregateId: string, eventData: FamilyDeletedEventData, version: number) {
    super(aggregateId, 'Family', eventData, version);
  }
}
