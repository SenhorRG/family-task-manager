import {
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateTaskRequestDto {
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must have at least 3 characters' })
  @MaxLength(200, { message: 'Title cannot have more than 200 characters' })
  title: string;

  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must have at least 10 characters' })
  @MaxLength(1000, {
    message: 'Description cannot have more than 1000 characters',
  })
  description: string;

  @IsString({ message: 'Family ID must be a string' })
  familyId: string;

  @IsArray({ message: 'Assigned users must be an array' })
  @ArrayMinSize(1, { message: 'There must be at least one assigned user' })
  @IsString({ each: true, message: 'Each user ID must be a string' })
  assignedTo: string[];

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(200, { message: 'Location cannot have more than 200 characters' })
  location?: string;
}
