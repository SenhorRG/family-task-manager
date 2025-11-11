import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { ReplayEventsAfterCommand } from './replay-events-after.command';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { EventBus } from '@nestjs/cqrs';
import { ReplayEventErrorDto, ReplayEventsResponseDto, ReplayProgressDto } from '../../dtos';

@CommandHandler(ReplayEventsAfterCommand)
export class ReplayEventsAfterHandler implements ICommandHandler<ReplayEventsAfterCommand> {
  private readonly logger = new Logger(ReplayEventsAfterHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReplayEventsAfterCommand): Promise<ReplayEventsResponseDto> {
    this.logger.log(`🔄 Executando replay incremental após ${command.timestamp.toISOString()}...`);

    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    let totalEvents = 0;
    let processedEvents = 0;
    let failedEvents = 0;
    const errors: ReplayEventErrorDto[] = [];

    try {
      const allEvents = await this.eventStore.getAllEvents();
      const filteredEvents = allEvents.filter((event) => event.occurredOn > command.timestamp);
      totalEvents = filteredEvents.length;

      this.logger.log(`Found ${filteredEvents.length} events to replay`);

      for (const event of filteredEvents) {
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
        `Incremental replay completed: ${processedEvents}/${totalEvents} events processed`,
      );

      const progress = new ReplayProgressDto(totalEvents, processedEvents, failedEvents, errors);

      return new ReplayEventsResponseDto(
        failedEvents === 0,
        `Incremental replay completed: ${processedEvents}/${totalEvents} events processed`,
        progress,
      );
    } catch (error) {
      this.logger.error(`Error during incremental event replay: ${error.message}`, error.stack);
      throw error;
    }
  }
}
