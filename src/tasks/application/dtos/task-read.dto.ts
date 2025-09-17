export class TaskReadDto {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly familyId: string,
    public readonly assignments: Array<{
      assignedTo: {
        memberId: string;
        memberName: string;
      };
      assignedBy: {
        memberId: string;
        memberName: string;
      };
      assignedAt: Date;
    }>,
    public readonly status: string,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly dueDate?: Date,
    public readonly location?: string,
  ) {}
}
