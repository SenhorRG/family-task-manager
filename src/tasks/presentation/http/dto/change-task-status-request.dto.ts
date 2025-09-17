import { IsEnum } from 'class-validator';
import { TaskStatus } from '../../../../tasks/domain/value-objects';

export class ChangeTaskStatusRequestDto {
  @IsEnum(TaskStatus, { message: 'Status must be a valid value' })
  status: TaskStatus;
}
