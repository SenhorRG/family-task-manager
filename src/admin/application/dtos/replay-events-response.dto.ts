export class ReplayEventErrorDto {
  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly error: string,
  ) {}
}

export class ReplayProgressDto {
  constructor(
    public readonly totalEvents: number,
    public readonly processedEvents: number,
    public readonly failedEvents: number,
    public readonly errors: ReplayEventErrorDto[],
  ) {}
}

export class ReplayEventsResponseDto {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly progress: ReplayProgressDto,
  ) {}
}
