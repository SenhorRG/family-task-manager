import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { RehydrateAllAggregatesCommand } from './rehydrate-all-aggregates.command';
import { UserRehydratorAdapter } from '../../../../users/application/services';
import { FamilyRehydratorAdapter } from '../../../../families/application/services';
import { TaskRehydratorAdapter } from '../../../../tasks/application/services';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { BaseEvent } from '../../../../shared';
import {
  RehydrationErrorDto,
  RehydrationResultDto,
  RehydrateAllAggregatesResponseDto,
} from '../../dtos';

@CommandHandler(RehydrateAllAggregatesCommand)
export class RehydrateAllAggregatesHandler
  implements ICommandHandler<RehydrateAllAggregatesCommand>
{
  private readonly logger = new Logger(RehydrateAllAggregatesHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly userRehydrator: UserRehydratorAdapter,
    private readonly familyRehydrator: FamilyRehydratorAdapter,
    private readonly taskRehydrator: TaskRehydratorAdapter,
  ) {}

  async execute(
    command: RehydrateAllAggregatesCommand,
  ): Promise<RehydrateAllAggregatesResponseDto> {
    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    if (!command.aggregateType) {
      this.logger.log('🔄 Executando rehydratação completa de todos os aggregates...');

      const results = await Promise.all<RehydrationResultDto>([
        this.rehydrateAllForType('User', this.userRehydrator),
        this.rehydrateAllForType('Family', this.familyRehydrator),
        this.rehydrateAllForType('Task', this.taskRehydrator),
      ]);

      const totalRehydrated = results.reduce((sum, r) => sum + r.rehydrated, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

      return new RehydrateAllAggregatesResponseDto(
        totalErrors === 0,
        `Rehydration completed: ${totalRehydrated} aggregates rehydrated, ${totalErrors} errors`,
        results,
      );
    }

    this.logger.log(`🔄 Executando rehydratação para tipo: ${command.aggregateType}`);

    let rehydrator;
    switch (command.aggregateType.toUpperCase()) {
      case 'USER':
        rehydrator = this.userRehydrator;
        break;
      case 'FAMILY':
        rehydrator = this.familyRehydrator;
        break;
      case 'TASK':
        rehydrator = this.taskRehydrator;
        break;
      default:
        throw new Error(
          `Invalid aggregate type: ${command.aggregateType}. Use USER, FAMILY, or TASK`,
        );
    }

    const result = await this.rehydrateAllForType(command.aggregateType, rehydrator);

    return new RehydrateAllAggregatesResponseDto(
      result.errors.length === 0,
      `Rehydration completed for ${command.aggregateType}: ${result.rehydrated}/${result.total} rehydrated, ${result.errors.length} errors`,
      [result],
    );
  }

  private async rehydrateAllForType<T>(
    aggregateType: string,
    rehydrator: {
      rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<T>;
      saveWithoutEvents(aggregate: T): Promise<void>;
      checkExists(aggregateId: string): Promise<boolean>;
      getAggregateType(): string;
    },
  ): Promise<RehydrationResultDto> {
    this.logger.log(`🔄 Starting rehydration of all ${aggregateType} aggregates...`);

    let total = 0;
    let rehydrated = 0;
    let skipped = 0;
    const errors: RehydrationErrorDto[] = [];

    try {
      const allEvents = await this.eventStore!.getAllEvents();
      this.logger.log(`📊 Found ${allEvents.length} total events in Event Store`);

      const eventsByAggregate = new Map<string, BaseEvent[]>();

      for (const event of allEvents) {
        if (event.aggregateType === aggregateType) {
          if (!eventsByAggregate.has(event.aggregateId)) {
            eventsByAggregate.set(event.aggregateId, []);
          }
          eventsByAggregate.get(event.aggregateId)!.push(event);
        }
      }

      const totalEventsForType = allEvents.filter((e) => e.aggregateType === aggregateType).length;
      this.logger.log(
        `📊 Found ${eventsByAggregate.size} ${aggregateType} aggregates with ${totalEventsForType} events`,
      );
      total = eventsByAggregate.size;

      for (const [aggregateId, events] of eventsByAggregate) {
        try {
          const exists = await rehydrator.checkExists(aggregateId);
          if (exists) {
            skipped++;
            continue;
          }

          const sortedEvents = events.sort((a, b) => a.version - b.version);
          const aggregate = await rehydrator.rehydrateAggregate(aggregateId, sortedEvents);
          await rehydrator.saveWithoutEvents(aggregate);
          rehydrated++;
        } catch (error) {
          const message = (error as Error).message ?? 'Unknown rehydration error';
          errors.push(new RehydrationErrorDto(aggregateId, message));
          this.logger.error(`Error rehydrating ${aggregateType} ${aggregateId}: ${error.message}`);
        }
      }

      this.logger.log(
        `✅ ${aggregateType} rehydration completed: ${rehydrated}/${total} rehydrated, ` +
          `${skipped} skipped, ${errors.length} errors`,
      );

      return new RehydrationResultDto(aggregateType, total, rehydrated, skipped, errors);
    } catch (error) {
      this.logger.error(`Error during ${aggregateType} rehydration: ${error.message}`, error.stack);
      throw error;
    }
  }
}
