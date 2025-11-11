import { BaseEntity } from './base.entity';
import { BaseEvent } from './base.event';

export abstract class BaseAggregate extends BaseEntity {
  private _uncommittedEvents: BaseEvent[] = [];
  private _version: number = 0;

  get version(): number {
    return this._version;
  }

  get uncommittedEvents(): BaseEvent[] {
    return [...this._uncommittedEvents];
  }

  protected addEvent(event: BaseEvent): void {
    this._uncommittedEvents.push(event);
    this._version++;
    this.updateTimestamp();
  }

  public markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  public loadFromHistory(events: BaseEvent[]): void {
    events.forEach((event) => {
      this.applyEvent(event);
      this._version = event.version;
    });
  }

  public restoreVersion(version: number): void {
    this._version = version;
  }

  protected abstract applyEvent(event: BaseEvent): void;
}
