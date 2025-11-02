import { BaseEvent } from '../value-objects/base.event';

/**
 * Port (interface) para rehydratar aggregates do Event Store
 *
 * Esta interface define o contrato que os adapters de rehydratação devem implementar.
 * Segue o padrão Ports & Adapters (Hexagonal Architecture).
 */
export interface AggregateRehydrator<T> {
  /**
   * Reconstrói um aggregate a partir de seus eventos
   */
  rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<T>;

  /**
   * Salva o aggregate no Write Database sem emitir eventos
   * (usado na rehydratação, pois os eventos já existem no Event Store)
   */
  saveWithoutEvents(aggregate: T): Promise<void>;

  /**
   * Verifica se o aggregate já existe no Write Database
   */
  checkExists(aggregateId: string): Promise<boolean>;

  /**
   * Retorna o tipo do aggregate que este rehydrator manipula
   */
  getAggregateType(): string;
}

