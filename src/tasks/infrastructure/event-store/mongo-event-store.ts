import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoEventStore as BaseMongoEventStore, BaseEvent } from '../../../shared';
import {
  TaskStatusChangedEvent,
  TaskAssignmentAddedEvent,
  TaskUpdatedEvent,
  TaskCreatedEvent,
  TaskAssignmentRemovedEvent,
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
export class TaskMongoEventStore extends BaseMongoEventStore {
  constructor(
    @InjectModel('Event', 'eventsConnection')
    eventModel: Model<EventDocument>,
  ) {
    super(eventModel);
  }

  protected getEventClass(eventType: string): any {
    const eventClasses = {
      TaskCreatedEvent: TaskCreatedEvent,
      TaskUpdatedEvent: TaskUpdatedEvent,
      TaskStatusChangedEvent: TaskStatusChangedEvent,
      TaskAssignmentAddedEvent: TaskAssignmentAddedEvent,
      TaskAssignmentRemovedEvent: TaskAssignmentRemovedEvent,
    };

    return eventClasses[eventType] || BaseEvent;
  }
}
