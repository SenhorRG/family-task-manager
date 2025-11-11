export class RehydrationErrorDto {
  constructor(
    public readonly aggregateId: string,
    public readonly error: string,
  ) {}
}

export class RehydrationResultDto {
  constructor(
    public readonly aggregateType: string,
    public readonly total: number,
    public readonly rehydrated: number,
    public readonly skipped: number,
    public readonly errors: RehydrationErrorDto[],
  ) {}
}

export class RehydrateAllAggregatesResponseDto {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly results: RehydrationResultDto[],
  ) {}
}
