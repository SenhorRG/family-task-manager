import { TaskStatus } from '../../../domain/value-objects';

export class ChangeTaskStatusCommand {
  constructor(
    public readonly taskId: string,
    public readonly newStatus: TaskStatus,
    public readonly changedBy: string,
  ) {}
}
