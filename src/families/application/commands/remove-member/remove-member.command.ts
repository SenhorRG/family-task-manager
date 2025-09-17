export class RemoveMemberCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly removedBy: string,
  ) {}
}
