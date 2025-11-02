import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventStore } from '../../domain/ports/event-store.port';
import { BaseEvent } from '../../domain/value-objects/base.event';
import { GenericEvent } from '../../domain/value-objects/generic.event';

export interface EventDocument {
  _id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: any;
  occurredOn: Date;
  version: number;
}

export class ConcurrentModificationException extends Error {
  constructor(aggregateId: string, expectedVersion: number, actualVersion: number) {
    super(
      `Concurrent modification detected for aggregate ${aggregateId}. Expected version ${expectedVersion}, but actual version is ${actualVersion}`,
    );
    this.name = 'ConcurrentModificationException';
  }
}

@Injectable()
export abstract class MongoEventStore implements EventStore {
  private readonly logger = new Logger(MongoEventStore.name);

  constructor(
    @InjectModel('Event', 'eventsConnection')
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async saveEvents(
    aggregateId: string,
    events: BaseEvent[],
    expectedVersion: number,
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    // Verificar versão atual do aggregate no event store (optimistic locking)
    const existingEvents = await this.eventModel.find({ aggregateId }).sort({ version: -1 }).limit(1).exec();
    
    const currentVersion = existingEvents.length > 0 ? existingEvents[0].version : 0;
    
    if (currentVersion !== expectedVersion) {
      this.logger.error(
        `Version mismatch for aggregate ${aggregateId}. Expected: ${expectedVersion}, Current: ${currentVersion}`,
      );
      throw new ConcurrentModificationException(aggregateId, expectedVersion, currentVersion);
    }

    // Verificar se a primeira versão do evento corresponde à próxima versão esperada
    const nextExpectedVersion = currentVersion + 1;
    if (events[0].version !== nextExpectedVersion) {
      this.logger.error(
        `Event version mismatch for aggregate ${aggregateId}. Expected first event version: ${nextExpectedVersion}, Actual: ${events[0].version}`,
      );
      throw new ConcurrentModificationException(aggregateId, nextExpectedVersion, events[0].version);
    }

    const eventDocuments = events.map((event) => ({
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventData: event.eventData,
      occurredOn: event.occurredOn,
      version: event.version,
    }));

    await this.eventModel.insertMany(eventDocuments);
    this.logger.log(`Saved ${events.length} events for aggregate ${aggregateId}`);
  }

  async getEvents(aggregateId: string): Promise<BaseEvent[]> {
    const eventDocs = await this.eventModel.find({ aggregateId }).sort({ version: 1 }).exec();

    return eventDocs.map((doc) => this.mapToEvent(doc));
  }

  async getAllEvents(): Promise<BaseEvent[]> {
    const eventDocs = await this.eventModel.find().sort({ occurredOn: 1 }).exec();

    return eventDocs.map((doc) => this.mapToEvent(doc));
  }

  private mapToEvent(doc: EventDocument): BaseEvent {
    const eventClass = this.getEventClass(doc.eventType);
    
    // Log para debug
    this.logger.debug(
      `Mapping event: ${doc.eventType} | aggregateId: ${doc.aggregateId} | aggregateType in DB: "${doc.aggregateType}" | eventClass: ${eventClass?.name || 'NOT FOUND'}`,
    );
    
    // Se não encontramos a classe do evento, usar GenericEvent com o aggregateType do documento
    // IMPORTANTE: Passar o eventType original para preservar no GenericEvent
    if (!eventClass || eventClass === BaseEvent || eventClass.name === 'BaseEvent') {
      this.logger.warn(
        `⚠️ Event class not found for ${doc.eventType}, using GenericEvent with original eventType preserved`,
      );
      return new GenericEvent(
        doc.aggregateId,
        doc.aggregateType,
        doc.eventData,
        doc.version,
        doc.eventType, // Preservar o eventType original
      );
    }
    
    // Evento específico encontrado - criar usando o construtor correto
    // Os eventos específicos esperam (aggregateId, eventData, version)
    // e internamente chamam super(aggregateId, 'User', eventData, version)
    let event: BaseEvent;
    
    try {
      event = new eventClass(doc.aggregateId, doc.eventData, doc.version);
    } catch (error) {
      this.logger.error(
        `❌ Error creating event ${doc.eventType}: ${error.message}. Falling back to BaseEvent.`,
      );
      // Em caso de erro, criar GenericEvent diretamente
      return new GenericEvent(
        doc.aggregateId,
        String(doc.aggregateType || 'Unknown'),
        doc.eventData,
        doc.version,
        doc.eventType, // Preservar o eventType original
      );
    }
    
    // SEMPRE garantir que o aggregateType seja uma string válida do documento
    // O aggregateType do documento é a fonte da verdade
    const dbAggregateType = String(doc.aggregateType || 'Unknown');
    
    if (typeof event.aggregateType !== 'string' || event.aggregateType !== dbAggregateType) {
      this.logger.warn(
        `⚠️ Fixing aggregateType for ${doc.eventType}: event has "${String(event.aggregateType)}" (${typeof event.aggregateType}), DB has "${dbAggregateType}". Using DB value.`,
      );
      
      // Substituir a propriedade readonly usando defineProperty
      // Isso é necessário porque aggregateType é readonly
      Object.defineProperty(event, 'aggregateType', {
        value: dbAggregateType,
        writable: false,
        configurable: true,
        enumerable: true,
      });
    }
    
    return event;
  }

  protected abstract getEventClass(eventType: string): any;
}
