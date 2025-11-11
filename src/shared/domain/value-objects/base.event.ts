export type EventPayload = Record<string, unknown>;

export abstract class BaseEvent<TData extends EventPayload = EventPayload> {
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly eventData: TData;
  public readonly occurredOn: Date;
  public readonly version: number;

  constructor(aggregateId: string, aggregateType: string, eventData: TData, version: number = 1) {
    this.eventType = this.constructor.name;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventData = eventData;
    this.occurredOn = new Date();
    this.version = version;
  }
}
