import { BaseEvent, EventPayload } from '../../../shared/domain/value-objects';

export interface TaskDeletedEventData extends EventPayload {
  title: string;
  familyId: string;
  deletedAt: Date;
}

export class TaskDeletedEvent extends BaseEvent<TaskDeletedEventData> {
  constructor(aggregateId: string, eventData: TaskDeletedEventData, version: number) {
    super(aggregateId, 'Task', eventData, version);
  }
}
