import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { ReplayEventsAfterCommand } from './replay-events-after.command';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { EventBus } from '@nestjs/cqrs';

interface ReplayProgress {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  errors: Array<{ event: any; error: Error }>;
}

@CommandHandler(ReplayEventsAfterCommand)
export class ReplayEventsAfterHandler implements ICommandHandler<ReplayEventsAfterCommand> {
  private readonly logger = new Logger(ReplayEventsAfterHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReplayEventsAfterCommand): Promise<any> {
    this.logger.log(`🔄 Executando replay incremental após ${command.timestamp.toISOString()}...`);

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
      const allEvents = await this.eventStore.getAllEvents();
      const filteredEvents = allEvents.filter((event) => event.occurredOn > command.timestamp);
      progress.totalEvents = filteredEvents.length;

      this.logger.log(`Found ${filteredEvents.length} events to replay`);

      for (const event of filteredEvents) {
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
        `Incremental replay completed: ${progress.processedEvents}/${progress.totalEvents} events processed`,
      );

      return {
        success: progress.failedEvents === 0,
        message: `Incremental replay completed: ${progress.processedEvents}/${progress.totalEvents} events processed`,
        progress,
      };
    } catch (error) {
      this.logger.error(`Error during incremental event replay: ${error.message}`, error.stack);
      throw error;
    }
  }
}
