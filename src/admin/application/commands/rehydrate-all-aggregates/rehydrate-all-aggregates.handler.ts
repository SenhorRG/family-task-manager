import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { RehydrateAllAggregatesCommand } from './rehydrate-all-aggregates.command';
import { UserRehydratorAdapter } from '../../../../users/application/services';
import { FamilyRehydratorAdapter } from '../../../../families/application/services';
import { TaskRehydratorAdapter } from '../../../../tasks/application/services';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { BaseEvent } from '../../../../shared';

interface RehydrationResult {
  aggregateType: string;
  total: number;
  rehydrated: number;
  skipped: number;
  errors: Array<{ aggregateId: string; error: string }>;
}

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

  async execute(command: RehydrateAllAggregatesCommand): Promise<any> {
    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    if (!command.aggregateType) {
      this.logger.log('🔄 Executando rehydratação completa de todos os aggregates...');

      const results = await Promise.all([
        this.rehydrateAllForType('User', this.userRehydrator),
        this.rehydrateAllForType('Family', this.familyRehydrator),
        this.rehydrateAllForType('Task', this.taskRehydrator),
      ]);

      const totalRehydrated = results.reduce((sum, r) => sum + r.rehydrated, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

      return {
        success: totalErrors === 0,
        message: `Rehydration completed: ${totalRehydrated} aggregates rehydrated, ${totalErrors} errors`,
        results,
      };
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

    return {
      success: result.errors.length === 0,
      message: `Rehydration completed for ${command.aggregateType}: ${result.rehydrated}/${result.total} rehydrated, ${result.errors.length} errors`,
      result,
    };
  }

  private async rehydrateAllForType<T>(
    aggregateType: string,
    rehydrator: {
      rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<T>;
      saveWithoutEvents(aggregate: T): Promise<void>;
      checkExists(aggregateId: string): Promise<boolean>;
      getAggregateType(): string;
    },
  ): Promise<RehydrationResult> {
    this.logger.log(`🔄 Starting rehydration of all ${aggregateType} aggregates...`);

    const result: RehydrationResult = {
      aggregateType,
      total: 0,
      rehydrated: 0,
      skipped: 0,
      errors: [],
    };

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

      this.logger.log(
        `📊 Found ${eventsByAggregate.size} ${aggregateType} aggregates with ${allEvents.filter((e) => e.aggregateType === aggregateType).length} events`,
      );
      result.total = eventsByAggregate.size;

      for (const [aggregateId, events] of eventsByAggregate) {
        try {
          const exists = await rehydrator.checkExists(aggregateId);
          if (exists) {
            result.skipped++;
            continue;
          }

          const sortedEvents = events.sort((a, b) => a.version - b.version);
          const aggregate = await rehydrator.rehydrateAggregate(aggregateId, sortedEvents);
          await rehydrator.saveWithoutEvents(aggregate);
          result.rehydrated++;
        } catch (error) {
          result.errors.push({
            aggregateId,
            error: error.message,
          });
          this.logger.error(`Error rehydrating ${aggregateType} ${aggregateId}: ${error.message}`);
        }
      }

      this.logger.log(
        `✅ ${aggregateType} rehydration completed: ${result.rehydrated}/${result.total} rehydrated, ` +
          `${result.skipped} skipped, ${result.errors.length} errors`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error during ${aggregateType} rehydration: ${error.message}`, error.stack);
      throw error;
    }
  }
}
