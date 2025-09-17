import { FamilyRole } from '../../../domain/value-objects';

export class CreateFamilyCommand {
  constructor(
    public readonly name: string,
    public readonly principalResponsibleUserId: string,
    public readonly principalRole: FamilyRole,
  ) {}
}
