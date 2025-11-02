import { BaseEvent } from './base.event';

export class GenericEvent extends BaseEvent {
  private readonly _originalEventType: string;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventData: any,
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
