import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoEventStore as BaseMongoEventStore, BaseEvent } from '../../../shared';
import { UserCreatedEvent, UserLoggedInEvent, UserDeletedEvent } from '../../domain/events';

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
      UserDeletedEvent: UserDeletedEvent,
    };

    const found = eventClasses[eventType];
    if (!found) {
      console.warn(`⚠️ Event class not found for eventType: "${eventType}". Available: ${Object.keys(eventClasses).join(', ')}`);
      return BaseEvent;
    }
    
    return found;
  }
}
