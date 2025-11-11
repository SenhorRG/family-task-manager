import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { ReplayAllEventsCommand } from './replay-all-events.command';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { EventBus } from '@nestjs/cqrs';
import { ReplayEventErrorDto, ReplayEventsResponseDto, ReplayProgressDto } from '../../dtos';

@CommandHandler(ReplayAllEventsCommand)
export class ReplayAllEventsHandler implements ICommandHandler<ReplayAllEventsCommand> {
  private readonly logger = new Logger(ReplayAllEventsHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(): Promise<ReplayEventsResponseDto> {
    this.logger.log('🔄 Executando replay completo de todos os eventos...');

    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    let totalEvents = 0;
    let processedEvents = 0;
    let failedEvents = 0;
    const errors: ReplayEventErrorDto[] = [];

    try {
      const allEvents = await this.eventStore.getAllEvents();
      totalEvents = allEvents.length;

      this.logger.log(`Found ${allEvents.length} events to replay`);

      for (const event of allEvents) {
        try {
          await this.eventBus.publish(event);
          processedEvents++;
        } catch (error) {
          failedEvents++;
          const message = (error as Error).message ?? 'Unknown replay error';
          errors.push(new ReplayEventErrorDto(event.aggregateId, event.eventType, message));
          this.logger.error(
            `Failed to replay event ${event.eventType} for aggregate ${event.aggregateId}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Replay completed: ${processedEvents}/${totalEvents} events processed, ${failedEvents} failed`,
      );

      const progress = new ReplayProgressDto(totalEvents, processedEvents, failedEvents, errors);

      return new ReplayEventsResponseDto(
        failedEvents === 0,
        `Replay completed: ${processedEvents}/${totalEvents} events processed, ${failedEvents} failed`,
        progress,
      );
    } catch (error) {
      this.logger.error(`Error during event replay: ${error.message}`, error.stack);
      throw error;
    }
  }
}
