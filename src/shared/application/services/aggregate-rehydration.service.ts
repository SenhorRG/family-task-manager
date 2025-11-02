import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { EventStore } from '../../domain/ports/event-store.port';
import { BaseEvent } from '../../domain/value-objects/base.event';

export interface RehydrationResult {
  aggregateType: string;
  total: number;
  rehydrated: number;
  skipped: number;
  errors: Array<{ aggregateId: string; error: string }>;
}

export interface AggregateRehydrator<T> {
  rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<T>;
  saveWithoutEvents(aggregate: T): Promise<void>;
  checkExists(aggregateId: string): Promise<boolean>;
  getAggregateType(): string;
}

/**
 * Serviço genérico para rehydratar qualquer tipo de aggregate do Event Store para o Write Database
 * 
 * Este serviço orquestra a rehydratação de todos os aggregates (User, Family, Task)
 */
@Injectable()
export class AggregateRehydrationService {
  private readonly logger = new Logger(AggregateRehydrationService.name);

  constructor(
    @Optional() @Inject('EventStore') private readonly eventStore: EventStore | null,
  ) {}

  /**
   * Rehydrata um aggregate específico usando um rehydrator fornecido
   */
  async rehydrateAggregate<T>(
    aggregateId: string,
    aggregateType: string,
    rehydrator: AggregateRehydrator<T>,
    eventStore?: EventStore,
  ): Promise<void> {
    this.logger.log(`🔄 Starting rehydration for ${aggregateType} ${aggregateId}...`);

    const store = eventStore || this.eventStore;
    if (!store) {
      throw new Error('EventStore must be provided either via injection or parameter');
    }

    try {
      // Verificar se já existe
      const exists = await rehydrator.checkExists(aggregateId);
      if (exists) {
        this.logger.warn(`${aggregateType} ${aggregateId} already exists, skipping rehydration`);
        return;
      }

      // Obter eventos
      const events = await store.getEvents(aggregateId);
      if (events.length === 0) {
        throw new Error(`No events found for ${aggregateType} ${aggregateId}`);
      }

      // Verificar tipo do aggregate
      const firstEvent = events[0];
      if (firstEvent.aggregateType !== aggregateType) {
        throw new Error(
          `Event aggregate type mismatch. Expected ${aggregateType}, got ${firstEvent.aggregateType}`,
        );
      }

      // Reconstruir aggregate
      const aggregate = await rehydrator.rehydrateAggregate(aggregateId, events);

      // Salvar sem eventos
      await rehydrator.saveWithoutEvents(aggregate);

      this.logger.log(`✅ ${aggregateType} ${aggregateId} successfully rehydrated`);
    } catch (error) {
      this.logger.error(`Error rehydrating ${aggregateType} ${aggregateId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Rehydrata todos os aggregates de um tipo específico
   */
  async rehydrateAllAggregates<T>(
    aggregateType: string,
    rehydrator: AggregateRehydrator<T>,
    eventStore?: EventStore,
  ): Promise<RehydrationResult> {
    this.logger.log(`🔄 Starting rehydration of all ${aggregateType} aggregates...`);

    const store = eventStore || this.eventStore;
    if (!store) {
      throw new Error('EventStore must be provided either via injection or parameter');
    }

    const result: RehydrationResult = {
      aggregateType,
      total: 0,
      rehydrated: 0,
      skipped: 0,
      errors: [],
    };

    try {
      // Obter todos os eventos
      const allEvents = await store.getAllEvents();
      this.logger.log(`📊 Found ${allEvents.length} total events in Event Store`);

      // Filtrar eventos do tipo correto e agrupar por aggregateId
      const eventsByAggregate = new Map<string, BaseEvent[]>();
      
      // Log para debug: mostrar todos os eventos encontrados
      if (allEvents.length > 0) {
        this.logger.log(`🔍 Eventos encontrados no Event Store:`);
        for (const event of allEvents) {
          this.logger.log(
            `   - ${event.eventType} | aggregateId: ${event.aggregateId} | aggregateType: "${event.aggregateType}" | versão: ${event.version}`,
          );
        }
        this.logger.log(`🔍 Procurando por aggregateType: "${aggregateType}"`);
      }
      
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

      // Rehydratar cada aggregate
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

  /**
   * Rehydrata todos os tipos de aggregates (User, Family, Task)
   */
  async rehydrateAllAggregatesTypes(
    rehydrators: AggregateRehydrator<any>[],
    eventStore?: EventStore,
  ): Promise<RehydrationResult[]> {
    this.logger.log('🔄 Starting rehydration of all aggregate types...');

    const store = eventStore || this.eventStore;
    if (!store) {
      throw new Error('EventStore must be provided either via injection or parameter');
    }

    const results: RehydrationResult[] = [];

    for (const rehydrator of rehydrators) {
      try {
        const result = await this.rehydrateAllAggregates(
          rehydrator.getAggregateType(),
          rehydrator,
          store,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Error rehydrating ${rehydrator.getAggregateType()}: ${error.message}`,
          error.stack,
        );
        results.push({
          aggregateType: rehydrator.getAggregateType(),
          total: 0,
          rehydrated: 0,
          skipped: 0,
          errors: [{ aggregateId: 'ALL', error: error.message }],
        });
      }
    }

    return results;
  }
}

