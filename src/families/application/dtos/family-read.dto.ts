export class FamilyReadDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly members: Array<{
      userId: string;
      memberName: string;
      role: string;
      responsibility: string;
      joinedAt: Date;
    }>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
