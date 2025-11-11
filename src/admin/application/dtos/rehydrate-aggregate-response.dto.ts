export class RehydrateAggregateResponseDto {
  constructor(
    public readonly success: boolean,
    public readonly message: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
  ) {}
}
