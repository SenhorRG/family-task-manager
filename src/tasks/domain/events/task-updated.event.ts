import { BaseEvent } from '../../../shared/domain/value-objects';

export class TaskUpdatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      title?: string;
      description?: string;
      dueDate?: Date;
      location?: string;
      updatedBy: string;
      updatedAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Task', eventData, version);
  }
}
