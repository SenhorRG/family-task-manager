import { UserId } from '../../../users/domain/value-objects';

export class TaskAssignmentVO {
  private readonly _assignedTo: UserId;
  private readonly _assignedAt: Date;
  private readonly _assignedBy: UserId;

  constructor(assignedTo: UserId, assignedBy: UserId, assignedAt?: Date) {
    this._assignedTo = assignedTo;
    this._assignedBy = assignedBy;
    this._assignedAt = assignedAt || new Date();
  }

  get assignedTo(): UserId {
    return this._assignedTo;
  }

  get assignedBy(): UserId {
    return this._assignedBy;
  }

  get assignedAt(): Date {
    return this._assignedAt;
  }

  equals(other: TaskAssignmentVO): boolean {
    return this._assignedTo.equals(other._assignedTo);
  }
}
