import { IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class ReplayEventsAfterDto {
  @Type(() => Date)
  @IsDate({ message: 'Timestamp must be a valid date' })
  timestamp: Date;
}

