export class UpdateTaskCommand {
  constructor(
    public readonly taskId: string,
    public readonly updatedBy: string,
    public readonly title?: string,
    public readonly description?: string,
    public readonly dueDate?: Date,
    public readonly location?: string,
  ) {}
}
