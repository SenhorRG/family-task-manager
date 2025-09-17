import { IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { FamilyRole } from '../../../domain/value-objects';

export class CreateFamilyRequestDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot be more than 100 characters' })
  name: string;

  @IsEnum(FamilyRole, { message: 'Role must be a valid value' })
  role: FamilyRole;
}
