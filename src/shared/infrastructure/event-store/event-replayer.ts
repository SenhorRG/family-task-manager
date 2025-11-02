import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { EventStore } from '../../domain/ports/event-store.port';
import { BaseEvent } from '../../domain/value-objects/base.event';

export interface ReplayProgress {
  totalEvents: number;
  processedEvents: number;
  failedEvents: number;
  errors: Array<{ event: BaseEvent; error: Error }>;
}

@Injectable()
export class EventReplayer {
  private readonly logger = new Logger(EventReplayer.name);

  constructor(
    @Optional() @Inject('EventStore') private readonly eventStore: EventStore | null,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Reprocessa todos os eventos do event store, publicando-os novamente no event bus
   * Útil para reconstruir o read database após falhas ou inconsistências
   * @param eventStore Opcional - Se não fornecido, usa o EventStore injetado
   */
  async replayAllEvents(eventStore?: EventStore): Promise<ReplayProgress> {
    const store = eventStore || this.eventStore;
    if (!store) {
      throw new Error('EventStore must be provided either via injection or parameter');
    }

    this.logger.log('Starting full event replay...');

    const progress: ReplayProgress = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      errors: [],
    };

    try {
      const allEvents = await store.getAllEvents();
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

      return progress;
    } catch (error) {
      this.logger.error(`Error during event replay: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reprocessa eventos de um aggregate específico
   * @param aggregateId ID do aggregate
   * @param eventStore Opcional - Se não fornecido, usa o EventStore injetado
   */
  async replayAggregateEvents(
    aggregateId: string,
    eventStore?: EventStore,
  ): Promise<ReplayProgress> {
    const store = eventStore || this.eventStore;
    if (!store) {
      throw new Error('EventStore must be provided either via injection or parameter');
    }

    this.logger.log(`Starting event replay for aggregate ${aggregateId}...`);

    const progress: ReplayProgress = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      errors: [],
    };

    try {
      const events = await store.getEvents(aggregateId);
      progress.totalEvents = events.length;

      this.logger.log(`Found ${events.length} events for aggregate ${aggregateId}`);

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
        `Replay completed for aggregate ${aggregateId}: ${progress.processedEvents}/${progress.totalEvents} events processed`,
      );

      return progress;
    } catch (error) {
      this.logger.error(
        `Error during event replay for aggregate ${aggregateId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Reprocessa apenas eventos novos (incremental replay)
   * Útil para sincronização periódica
   * @param timestamp Data a partir da qual reprocessar eventos
   * @param eventStore Opcional - Se não fornecido, usa o EventStore injetado
   */
  async replayEventsAfter(timestamp: Date, eventStore?: EventStore): Promise<ReplayProgress> {
    const store = eventStore || this.eventStore;
    if (!store) {
      throw new Error('EventStore must be provided either via injection or parameter');
    }

    this.logger.log(`Starting incremental event replay after ${timestamp.toISOString()}...`);

    const progress: ReplayProgress = {
      totalEvents: 0,
      processedEvents: 0,
      failedEvents: 0,
      errors: [],
    };

    try {
      const allEvents = await store.getAllEvents();
      const filteredEvents = allEvents.filter((event) => event.occurredOn > timestamp);
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

      return progress;
    } catch (error) {
      this.logger.error(`Error during incremental event replay: ${error.message}`, error.stack);
      throw error;
    }
  }
}

