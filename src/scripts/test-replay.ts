import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { EventReplayer } from '../shared';
import { Logger } from '@nestjs/common';

/**
 * Script para testar o replay de eventos
 * 
 * Uso:
 *   yarn test:replay                    - Replay completo
 *   yarn test:replay AGGREGATE_ID       - Replay de um aggregate específico
 */

async function testReplay() {
  const logger = new Logger('ReplayScript');
  const aggregateId = process.argv[2]; // ID do aggregate opcional

  try {
    logger.log('🚀 Iniciando script de teste de replay...');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const eventReplayer = app.get(EventReplayer);
    const eventStore = app.get('EventStore'); // Pega o EventStore do UsersModule
    
    if (!eventStore) {
      logger.error('❌ EventStore não encontrado. Verifique se está registrado em algum módulo.');
      await app.close();
      process.exit(1);
    }

    let progress;

    if (aggregateId) {
      logger.log(`🔄 Executando replay para aggregate: ${aggregateId}`);
      progress = await eventReplayer.replayAggregateEvents(aggregateId, eventStore);
    } else {
      logger.log('🔄 Executando replay completo de todos os eventos...');
      progress = await eventReplayer.replayAllEvents(eventStore);
    }

    // Exibir resultados
    console.log('\n📊 ===== RESULTADOS DO REPLAY =====');
    console.log(`Total de eventos: ${progress.totalEvents}`);
    console.log(`✅ Processados com sucesso: ${progress.processedEvents}`);
    console.log(`❌ Falhas: ${progress.failedEvents}`);
    
    if (progress.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      progress.errors.forEach(({ event, error }, index) => {
        console.log(`\n  Erro ${index + 1}:`);
        console.log(`    Evento: ${event.eventType}`);
        console.log(`    Aggregate: ${event.aggregateId}`);
        console.log(`    Versão: ${event.version}`);
        console.log(`    Mensagem: ${error.message}`);
      });
    } else {
      console.log('\n✨ Nenhum erro encontrado! Todos os eventos foram processados com sucesso.');
    }

    console.log('\n✅ Replay concluído com sucesso!');
    
    await app.close();
    process.exit(progress.failedEvents > 0 ? 1 : 0);
  } catch (error) {
    logger.error(`❌ Erro fatal durante o replay: ${error.message}`, error.stack);
    process.exit(1);
  }
}

testReplay().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

