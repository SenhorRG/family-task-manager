import { IsString } from 'class-validator';

export class AddTaskAssignmentRequestDto {
  @IsString({ message: 'User ID must be a string' })
  userId: string;
}
