export class CreateTaskCommand {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly familyId: string,
    public readonly assignedTo: string[],
    public readonly createdBy: string,
    public readonly dueDate?: Date,
    public readonly location?: string,
  ) {}
}
