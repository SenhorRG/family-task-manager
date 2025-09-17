export class AddTaskAssignmentCommand {
  constructor(
    public readonly taskId: string,
    public readonly assignedTo: string,
    public readonly assignedBy: string,
  ) {}
}
