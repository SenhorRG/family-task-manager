import { BaseEvent, EventPayload } from './base.event';

export class GenericEvent<TData extends EventPayload = EventPayload> extends BaseEvent<TData> {
  private readonly _originalEventType: string;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventData: TData,
    version: number = 1,
    originalEventType?: string,
  ) {
    super(aggregateId, aggregateType, eventData, version);

    this._originalEventType = originalEventType || 'GenericEvent';

    Object.defineProperty(this, 'eventType', {
      value: this._originalEventType,
      writable: false,
      configurable: true,
      enumerable: true,
    });
  }

  get originalEventType(): string {
    return this._originalEventType;
  }
}
