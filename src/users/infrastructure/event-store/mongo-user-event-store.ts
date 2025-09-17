import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoEventStore as BaseMongoEventStore, BaseEvent } from '../../../shared';
import { UserCreatedEvent, UserLoggedInEvent } from '../../domain/events';

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
export class UserMongoEventStore extends BaseMongoEventStore {
  constructor(
    @InjectModel('Event', 'eventsConnection')
    eventModel: Model<EventDocument>,
  ) {
    super(eventModel);
  }

  protected getEventClass(eventType: string): any {
    const eventClasses = {
      UserCreatedEvent: UserCreatedEvent,
      UserLoggedInEvent: UserLoggedInEvent,
    };

    return eventClasses[eventType] || BaseEvent;
  }
}
