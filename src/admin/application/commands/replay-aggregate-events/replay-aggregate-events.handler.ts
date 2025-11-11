import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { ReplayAggregateEventsCommand } from './replay-aggregate-events.command';
import { EventStore } from '../../../../shared/domain/ports/event-store.port';
import { EventBus } from '@nestjs/cqrs';
import { ReplayEventErrorDto, ReplayEventsResponseDto, ReplayProgressDto } from '../../dtos';

@CommandHandler(ReplayAggregateEventsCommand)
export class ReplayAggregateEventsHandler implements ICommandHandler<ReplayAggregateEventsCommand> {
  private readonly logger = new Logger(ReplayAggregateEventsHandler.name);

  constructor(
    @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ReplayAggregateEventsCommand): Promise<ReplayEventsResponseDto> {
    this.logger.log(`🔄 Executando replay para aggregate: ${command.aggregateId}`);

    if (!this.eventStore) {
      throw new Error('EventStore not found. Make sure it is registered in a module.');
    }

    let totalEvents = 0;
    let processedEvents = 0;
    let failedEvents = 0;
    const errors: ReplayEventErrorDto[] = [];

    try {
      const events = await this.eventStore.getEvents(command.aggregateId);
      totalEvents = events.length;

      this.logger.log(`Found ${events.length} events for aggregate ${command.aggregateId}`);

      for (const event of events) {
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
        `Replay completed for aggregate ${command.aggregateId}: ${processedEvents}/${totalEvents} events processed`,
      );

      const progress = new ReplayProgressDto(totalEvents, processedEvents, failedEvents, errors);

      return new ReplayEventsResponseDto(
        failedEvents === 0,
        `Replay completed for aggregate ${command.aggregateId}: ${processedEvents}/${totalEvents} events processed`,
        progress,
      );
    } catch (error) {
      this.logger.error(
        `Error during event replay for aggregate ${command.aggregateId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
