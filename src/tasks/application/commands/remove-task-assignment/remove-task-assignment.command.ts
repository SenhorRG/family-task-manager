export class RemoveTaskAssignmentCommand {
  constructor(
    public readonly taskId: string,
    public readonly assignedTo: string,
    public readonly removedBy: string,
  ) {}
}
