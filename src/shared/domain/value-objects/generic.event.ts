import { BaseEvent } from './base.event';

/**
 * Evento genérico usado quando não conseguimos encontrar a classe específica do evento
 * Útil para reconstruir eventos do banco de dados quando a classe não está disponível
 * 
 * IMPORTANTE: Este evento preserva o eventType original do documento do banco
 */
export class GenericEvent extends BaseEvent {
  private readonly _originalEventType: string;

  constructor(
    aggregateId: string,
    aggregateType: string,
    eventData: any,
    version: number = 1,
    originalEventType?: string,
  ) {
    // Chamar super primeiro para inicializar BaseEvent
    super(aggregateId, aggregateType, eventData, version);
    
    // Preservar o eventType original do documento
    this._originalEventType = originalEventType || 'GenericEvent';
    
    // IMPORTANTE: Sobrescrever o eventType DEPOIS do super()
    // porque o BaseEvent define eventType como this.constructor.name no construtor
    // e precisamos sobrescrever isso para usar o eventType original do banco
    Object.defineProperty(this, 'eventType', {
      value: this._originalEventType,
      writable: false,
      configurable: true,
      enumerable: true,
    });
  }

  get originalEventType(): string {
    return this._originalEventType;
  }
}

