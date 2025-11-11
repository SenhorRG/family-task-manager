import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MongoEventStore as BaseMongoEventStore,
  EventConstructor,
  EventDocument,
} from '../../../shared';
import {
  TaskStatusChangedEvent,
  TaskAssignmentAddedEvent,
  TaskUpdatedEvent,
  TaskCreatedEvent,
  TaskAssignmentRemovedEvent,
} from '../../domain/events';

@Injectable()
export class TaskMongoEventStore extends BaseMongoEventStore {
  constructor(
    @InjectModel('Event', 'eventsConnection')
    eventModel: Model<EventDocument>,
  ) {
    super(eventModel);
  }

  protected getEventClass(eventType: string): EventConstructor | null {
    const eventClasses: Record<string, EventConstructor> = {
      TaskCreatedEvent: TaskCreatedEvent as EventConstructor,
      TaskUpdatedEvent: TaskUpdatedEvent as EventConstructor,
      TaskStatusChangedEvent: TaskStatusChangedEvent as EventConstructor,
      TaskAssignmentAddedEvent: TaskAssignmentAddedEvent as EventConstructor,
      TaskAssignmentRemovedEvent: TaskAssignmentRemovedEvent as EventConstructor,
    };

    return eventClasses[eventType] || null;
  }
}
