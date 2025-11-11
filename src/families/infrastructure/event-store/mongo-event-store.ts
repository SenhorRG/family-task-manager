import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MongoEventStore as BaseMongoEventStore,
  EventConstructor,
  EventDocument,
} from '../../../shared';
import {
  MemberRoleChangedEvent,
  MemberRemovedEvent,
  MemberAddedEvent,
  FamilyCreatedEvent,
} from '../../domain/events';

@Injectable()
export class FamilyMongoEventStore extends BaseMongoEventStore {
  constructor(
    @InjectModel('Event', 'eventsConnection')
    eventModel: Model<EventDocument>,
  ) {
    super(eventModel);
  }

  protected getEventClass(eventType: string): EventConstructor | null {
    const eventClasses: Record<string, EventConstructor> = {
      FamilyCreatedEvent: FamilyCreatedEvent as EventConstructor,
      MemberAddedEvent: MemberAddedEvent as EventConstructor,
      MemberRemovedEvent: MemberRemovedEvent as EventConstructor,
      MemberRoleChangedEvent: MemberRoleChangedEvent as EventConstructor,
    };

    return eventClasses[eventType] || null;
  }
}
