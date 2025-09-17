import { FamilyRole, FamilyResponsibility } from '../../../domain/value-objects';

export class ChangeMemberRoleCommand {
  constructor(
    public readonly familyId: string,
    public readonly userId: string,
    public readonly newRole: FamilyRole,
    public readonly newResponsibility: FamilyResponsibility,
    public readonly changedBy: string,
  ) {}
}
