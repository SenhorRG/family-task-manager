import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventStore } from '../../domain/ports/event-store.port';
import { BaseEvent, EventPayload } from '../../domain/value-objects/base.event';
import { GenericEvent } from '../../domain/value-objects/generic.event';

export interface EventDocument {
  _id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: EventPayload;
  occurredOn: Date;
  version: number;
}

export type EventConstructor = new (
  aggregateId: string,
  eventData: unknown,
  version?: number,
) => BaseEvent;

export class ConcurrentModificationException extends Error {
  constructor(aggregateId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrent modification detected for aggregate ${aggregateId}. Expected version ${expectedVersion}, but actual version is ${actualVersion}`,
    );
    this.name = 'ConcurrentModificationException';
  }
}

@Injectable()
export abstract class MongoEventStore implements EventStore {
  private readonly logger = new Logger(MongoEventStore.name);

  constructor(
    @InjectModel('Event', 'eventsConnection')
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async saveEvents(
    aggregateId: string,
    events: BaseEvent[],
    expectedVersion: number,
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const existingEvents = await this.eventModel
      .find({ aggregateId })
      .sort({ version: -1 })
      .limit(1)
      .exec();

    const currentVersion = existingEvents.length > 0 ? existingEvents[0].version : 0;

    if (currentVersion !== expectedVersion) {
      this.logger.error(
        `Version mismatch for aggregate ${aggregateId}. Expected: ${expectedVersion}, Current: ${currentVersion}`,
      );
      throw new ConcurrentModificationException(aggregateId, expectedVersion, currentVersion);
    }

    const nextExpectedVersion = currentVersion + 1;
    if (events[0].version !== nextExpectedVersion) {
      this.logger.error(
        `Event version mismatch for aggregate ${aggregateId}. Expected first event version: ${nextExpectedVersion}, Actual: ${events[0].version}`,
      );
      throw new ConcurrentModificationException(
        aggregateId,
        nextExpectedVersion,
        events[0].version,
      );
    }

    const eventDocuments = events.map((event) => ({
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      occurredOn: event.occurredOn,
      version: event.version,
    }));

    await this.eventModel.insertMany(eventDocuments);
    this.logger.log(`Saved ${events.length} events for aggregate ${aggregateId}`);
  }

  async getEvents(aggregateId: string): Promise<BaseEvent[]> {
    const eventDocs = await this.eventModel.find({ aggregateId }).sort({ version: 1 }).exec();

    return eventDocs.map((doc) => this.mapToEvent(doc));
  }

  async getAllEvents(): Promise<BaseEvent[]> {
    const eventDocs = await this.eventModel.find().sort({ occurredOn: 1 }).exec();

    return eventDocs.map((doc) => this.mapToEvent(doc));
  }

  private mapToEvent(doc: EventDocument): BaseEvent {
    const eventClass = this.getEventClass(doc.eventType);

    this.logger.debug(
      `Mapping event: ${doc.eventType} | aggregateId: ${doc.aggregateId} | aggregateType in DB: "${doc.aggregateType}" | eventClass: ${eventClass?.name || 'NOT FOUND'}`,
    );

    if (!eventClass || eventClass === BaseEvent || eventClass.name === 'BaseEvent') {
      this.logger.warn(
        `⚠️ Event class not found for ${doc.eventType}, using GenericEvent with original eventType preserved`,
      );
      return new GenericEvent(
        doc.aggregateId,
        doc.aggregateType,
        doc.eventData,
        doc.version,
        doc.eventType,
      );
    }

    let event: BaseEvent;

    try {
      event = new eventClass(doc.aggregateId, doc.eventData, doc.version);
    } catch (error) {
      this.logger.error(
        `❌ Error creating event ${doc.eventType}: ${error.message}. Falling back to BaseEvent.`,
      );
      return new GenericEvent(
        doc.aggregateId,
        String(doc.aggregateType || 'Unknown'),
        doc.eventData,
        doc.version,
        doc.eventType,
      );
    }

    const dbAggregateType = String(doc.aggregateType || 'Unknown');

    if (typeof event.aggregateType !== 'string' || event.aggregateType !== dbAggregateType) {
      this.logger.warn(
        `⚠️ Fixing aggregateType for ${doc.eventType}: event has "${String(event.aggregateType)}" (${typeof event.aggregateType}), DB has "${dbAggregateType}". Using DB value.`,
      );

      Object.defineProperty(event, 'aggregateType', {
        value: dbAggregateType,
        writable: false,
        configurable: true,
        enumerable: true,
      });
    }

    return event;
  }

  protected abstract getEventClass(eventType: string): EventConstructor | null;
}
