import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from '@nestjs/common';
import { AggregateRehydrationService } from '../shared/application/services/aggregate-rehydration.service';
import { UserRehydratorAdapter } from '../users/application/services';
import { FamilyRehydratorAdapter } from '../families/application/services';
import { TaskRehydratorAdapter } from '../tasks/application/services';

/**
 * Script para rehydratar o Write Database a partir do Event Store
 *
 * DIFERENÇA ENTRE REPLAY E REHYDRATION:
 * - REPLAY: Reprocessa eventos → Atualiza Read Database (via projeções)
 * - REHYDRATION: Reconstrói aggregates → Atualiza Write Database (via rehydratação)
 *
 * Uso:
 *   yarn rehydrate:write                                    - Rehydrata todos os aggregates (User, Family, Task)
 *   yarn rehydrate:write USER                               - Rehydrata todos os Users
 *   yarn rehydrate:write FAMILY                             - Rehydrata todas as Families
 *   yarn rehydrate:write TASK                               - Rehydrata todas as Tasks
 *   yarn rehydrate:write USER USER_ID                       - Rehydrata um User específico
 *   yarn rehydrate:write FAMILY FAMILY_ID                   - Rehydrata uma Family específica
 *   yarn rehydrate:write TASK TASK_ID                       - Rehydrata uma Task específica
 */

async function rehydrateWriteDatabase() {
  const logger = new Logger('RehydrateScript');
  const aggregateType = process.argv[2]?.toUpperCase(); // USER, FAMILY, TASK ou undefined (todos)
  const aggregateId = process.argv[3]; // ID opcional

  try {
    const app = await NestFactory.createApplicationContext(AppModule);

    const rehydrationService = app.get(AggregateRehydrationService);

    // Obter EventStore do UsersModule
    const eventStore = app.get('EventStore');

    // Obter todos os adapters
    const userRehydrator = app.get(UserRehydratorAdapter);
    const familyRehydrator = app.get(FamilyRehydratorAdapter);
    const taskRehydrator = app.get(TaskRehydratorAdapter);

    let results;

    if (aggregateId && aggregateType) {
      let rehydrator;
      switch (aggregateType) {
        case 'USER':
          rehydrator = userRehydrator;
          break;
        case 'FAMILY':
          rehydrator = familyRehydrator;
          break;
        case 'TASK':
          rehydrator = taskRehydrator;
          break;
        default:
          throw new Error(`Invalid aggregate type: ${aggregateType}. Use USER, FAMILY, or TASK`);
      }

      await rehydrationService.rehydrateAggregate(
        aggregateId,
        aggregateType,
        rehydrator,
        eventStore,
      );
      results = [];
    } else if (aggregateType) {
      let rehydrator;
      switch (aggregateType) {
        case 'USER':
          rehydrator = userRehydrator;
          break;
        case 'FAMILY':
          rehydrator = familyRehydrator;
          break;
        case 'TASK':
          rehydrator = taskRehydrator;
          break;
        default:
          throw new Error(`Invalid aggregate type: ${aggregateType}. Use USER, FAMILY, or TASK`);
      }

      const result = await rehydrationService.rehydrateAllAggregates(
        aggregateType,
        rehydrator,
        eventStore,
      );
      results = [result];
    } else {
      results = await rehydrationService.rehydrateAllAggregatesTypes(
        [userRehydrator, familyRehydrator, taskRehydrator],
        eventStore,
      );
    }

    if (results.length === 0 && aggregateId) {
      // Já exibido acima
    } else {
      for (const result of results) {
        if (result.errors.length > 0) {
          result.errors.forEach(({ aggregateId: id, error }, index) => {
            console.log(`     ${index + 1}. ${id}: ${error}`);
          });
        }
      }

      const totalRehydrated = results.reduce((sum, r) => sum + r.rehydrated, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

      if (totalErrors === 0) {
        console.log(
          '\n✨ Nenhum erro encontrado! Todos os aggregates foram rehydratados com sucesso.',
        );
      }
    }

    console.log('\n✅ Rehydratação concluída!');

    await app.close();

    const hasErrors = results.some((r) => r.errors.length > 0);
    process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    logger.error(`❌ Erro fatal durante a rehydratação: ${error.message}`, error.stack);
    process.exit(1);
  }
}

rehydrateWriteDatabase().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
