import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventStore } from '../../domain/ports/event-store.port';
import { BaseEvent } from '../../domain/value-objects/base.event';

export interface EventDocument {
  _id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: any;
  occurredOn: Date;
  version: number;
}

@Injectable()
export abstract class MongoEventStore implements EventStore {
  constructor(
    @InjectModel('Event', 'eventsConnection')
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async saveEvents(
    aggregateId: string,
    events: BaseEvent[],
    expectedVersion: number,
  ): Promise<void> {
    const eventDocuments = events.map((event) => ({
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      occurredOn: event.occurredOn,
      version: event.version,
    }));

    await this.eventModel.insertMany(eventDocuments);
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
    return new eventClass(doc.aggregateId, doc.eventData, doc.version);
  }

  protected abstract getEventClass(eventType: string): any;
}
