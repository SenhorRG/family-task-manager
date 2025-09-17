import { IsString, IsOptional, IsDateString, MinLength, MaxLength } from 'class-validator';

export class UpdateTaskRequestDto {
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(3, { message: 'Title must have at least 3 characters' })
  @MaxLength(200, { message: 'Title cannot have more than 200 characters' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must have at least 10 characters' })
  @MaxLength(1000, {
    message: 'Description cannot have more than 1000 characters',
  })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate?: string;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  @MaxLength(200, { message: 'Location cannot have more than 200 characters' })
  location?: string;
}
