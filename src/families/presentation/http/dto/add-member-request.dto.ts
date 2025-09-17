import { IsString, IsEnum } from 'class-validator';
import { FamilyRole, FamilyResponsibility } from '../../../domain/value-objects';

export class AddMemberRequestDto {
  @IsString({ message: 'Family ID must be a string' })
  familyId: string;

  @IsString({ message: 'User ID must be a string' })
  userId: string;

  @IsEnum(FamilyRole, { message: 'Role must be a valid value' })
  role: FamilyRole;

  @IsEnum(FamilyResponsibility, { message: 'Responsibility must be a valid value' })
  responsibility: FamilyResponsibility;
}
