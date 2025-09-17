import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoEventStore as BaseMongoEventStore, BaseEvent } from '../../../shared';
import {
  MemberRoleChangedEvent,
  MemberRemovedEvent,
  MemberAddedEvent,
  FamilyCreatedEvent,
} from '../../domain/events';

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
export class FamilyMongoEventStore extends BaseMongoEventStore {
  constructor(
    @InjectModel('Event', 'eventsConnection')
    eventModel: Model<EventDocument>,
  ) {
    super(eventModel);
  }

  protected getEventClass(eventType: string): any {
    const eventClasses = {
      FamilyCreatedEvent: FamilyCreatedEvent,
      MemberAddedEvent: MemberAddedEvent,
      MemberRemovedEvent: MemberRemovedEvent,
      MemberRoleChangedEvent: MemberRoleChangedEvent,
    };

    return eventClasses[eventType] || BaseEvent;
  }
}
