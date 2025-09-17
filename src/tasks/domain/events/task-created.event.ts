import { BaseEvent } from '../../../shared/domain/value-objects';

export class TaskCreatedEvent extends BaseEvent {
  constructor(
    aggregateId: string,
    eventData: {
      title: string;
      description: string;
      familyId: string;
      assignedTo: string[];
      assignedBy: string;
      dueDate?: Date;
      location?: string;
      createdAt: Date;
    },
    version: number = 1,
  ) {
    super(aggregateId, 'Task', eventData, version);
  }
}
