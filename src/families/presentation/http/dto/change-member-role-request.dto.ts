import { IsString, IsEnum } from 'class-validator';
import { FamilyRole, FamilyResponsibility } from '../../../domain/value-objects';

export class ChangeMemberRoleRequestDto {
  @IsString({ message: 'Family ID must be a string' })
  familyId: string;

  @IsString({ message: 'User ID must be a string' })
  userId: string;

  @IsEnum(FamilyRole, { message: 'New role must be a valid value' })
  newRole: FamilyRole;

  @IsEnum(FamilyResponsibility, { message: 'New responsibility must be a valid value' })
  newResponsibility: FamilyResponsibility;
}
