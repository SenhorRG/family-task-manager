import { BaseEvent } from '../value-objects/base.event';

export interface AggregateRehydrator<T> {
  rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<T>;

  saveWithoutEvents(aggregate: T): Promise<void>;

  checkExists(aggregateId: string): Promise<boolean>;

  getAggregateType(): string;
}
