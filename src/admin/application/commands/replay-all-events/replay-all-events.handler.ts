import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { ReplayAllEventsCommand } from './replay-all-events.command';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { EventBus } from '@nestjs/cqrs';

interface ReplayProgress {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  errors: Array<{ event: any; error: Error }>;
}

@CommandHandler(ReplayAllEventsCommand)
export class ReplayAllEventsHandler implements ICommandHandler<ReplayAllEventsCommand> {
  private readonly logger = new Logger(ReplayAllEventsHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(): Promise<any> {
    this.logger.log('🔄 Executando replay completo de todos os eventos...');

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
      progress.totalEvents = allEvents.length;

      this.logger.log(`Found ${allEvents.length} events to replay`);

      for (const event of allEvents) {
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
        `Replay completed: ${progress.processedEvents}/${progress.totalEvents} events processed, ${progress.failedEvents} failed`,
      );

      return {
        success: progress.failedEvents === 0,
        message: `Replay completed: ${progress.processedEvents}/${progress.totalEvents} events processed, ${progress.failedEvents} failed`,
        progress,
      };
    } catch (error) {
      this.logger.error(`Error during event replay: ${error.message}`, error.stack);
      throw error;
    }
  }
}
