import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { ReplayAggregateEventsCommand } from './replay-aggregate-events.command';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { EventBus } from '@nestjs/cqrs';

interface ReplayProgress {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  errors: Array<{ event: any; error: Error }>;
}

@CommandHandler(ReplayAggregateEventsCommand)
export class ReplayAggregateEventsHandler
  implements ICommandHandler<ReplayAggregateEventsCommand>
{
  private readonly logger = new Logger(ReplayAggregateEventsHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReplayAggregateEventsCommand): Promise<any> {
    this.logger.log(`🔄 Executando replay para aggregate: ${command.aggregateId}`);

    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    const progress: ReplayProgress = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      errors: [],
    };

    try {
      const events = await this.eventStore.getEvents(command.aggregateId);
      progress.totalEvents = events.length;

      this.logger.log(`Found ${events.length} events for aggregate ${command.aggregateId}`);

      for (const event of events) {
        try {
          await this.eventBus.publish(event);
          progress.processedEvents++;
        } catch (error) {
          progress.failedEvents++;
          progress.errors.push({ event, error: error as Error });
          this.logger.error(
            `Failed to replay event ${event.eventType} for aggregate ${event.aggregateId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Replay completed for aggregate ${command.aggregateId}: ${progress.processedEvents}/${progress.totalEvents} events processed`,
      );

      return {
        success: progress.failedEvents === 0,
        message: `Replay completed for aggregate ${command.aggregateId}: ${progress.processedEvents}/${progress.totalEvents} events processed`,
        progress,
      };
    } catch (error) {
      this.logger.error(
        `Error during event replay for aggregate ${command.aggregateId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
