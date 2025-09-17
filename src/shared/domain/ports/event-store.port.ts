import { BaseEvent } from '../value-objects/base.event';

export interface EventStore {
  saveEvents(aggregateId: string, events: BaseEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string): Promise<BaseEvent[]>;
  getAllEvents(): Promise<BaseEvent[]>;
}
