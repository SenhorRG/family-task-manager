import { FamilyResponsibility, FamilyRole } from '../../../domain/value-objects';

export class AddMemberCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly role: FamilyRole,
    public readonly responsibility: FamilyResponsibility,
    public readonly addedBy: string,
  ) {}
}
