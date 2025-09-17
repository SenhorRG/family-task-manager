export abstract class BaseEvent {
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly aggregateType: string;
  public readonly eventData: any;
  public readonly occurredOn: Date;
  public readonly version: number;

  constructor(aggregateId: string, aggregateType: string, eventData: any, version: number = 1) {
    this.eventType = this.constructor.name;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.eventData = eventData;
    this.occurredOn = new Date();
    this.version = version;
  }
}
