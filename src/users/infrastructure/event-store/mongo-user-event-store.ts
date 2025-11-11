import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MongoEventStore as BaseMongoEventStore,
  EventConstructor,
  EventDocument,
} from '../../../shared';
import { UserCreatedEvent, UserLoggedInEvent, UserDeletedEvent } from '../../domain/events';

@Injectable()
export class UserMongoEventStore extends BaseMongoEventStore {
  constructor(
    @InjectModel('Event', 'eventsConnection')
    eventModel: Model<EventDocument>,
  ) {
    super(eventModel);
  }

  protected getEventClass(eventType: string): EventConstructor | null {
    const eventClasses: Record<string, EventConstructor> = {
      UserCreatedEvent: UserCreatedEvent as EventConstructor,
      UserLoggedInEvent: UserLoggedInEvent as EventConstructor,
      UserDeletedEvent: UserDeletedEvent as EventConstructor,
    };

    const found = eventClasses[eventType];
    if (!found) {
      console.warn(
        `⚠️ Event class not found for eventType: "${eventType}". Available: ${Object.keys(eventClasses).join(', ')}`,
      );
      return null;
    }

    return found;
  }
}
