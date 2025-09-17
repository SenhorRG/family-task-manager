export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class TaskStatusVO {
  private readonly _value: TaskStatus;

  constructor(status: TaskStatus) {
    this._value = status;
  }

  get value(): TaskStatus {
    return this._value;
  }

  equals(other: TaskStatusVO): boolean {
    return this._value === other._value;
  }

  isPending(): boolean {
    return this._value === TaskStatus.PENDING;
  }

  isInProgress(): boolean {
    return this._value === TaskStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this._value === TaskStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this._value === TaskStatus.CANCELLED;
  }

  canTransitionTo(newStatus: TaskStatus): boolean {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
    };

    return validTransitions[this._value].includes(newStatus);
  }

  toString(): string {
    return this._value;
  }
}
