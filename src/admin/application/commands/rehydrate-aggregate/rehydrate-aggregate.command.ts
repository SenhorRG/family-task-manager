export class RehydrateAggregateCommand {
  constructor(
    public readonly aggregateId: string,
    public readonly aggregateType: string,
  ) {}
}
