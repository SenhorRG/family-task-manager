import { IsISO8601 } from 'class-validator';

export class ReplayEventsAfterDto {
  @IsISO8601()
  timestamp: string;
}

