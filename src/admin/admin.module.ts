import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';

// Importar módulos necessários
import { UsersModule } from '../users/users.module';
import { FamiliesModule } from '../families/families.module';
import { TasksModule } from '../tasks/tasks.module';

// Commands
import {
  ReplayAllEventsHandler,
  ReplayAggregateEventsHandler,
  ReplayEventsAfterHandler,
  RehydrateAllAggregatesHandler,
  RehydrateAggregateHandler,
} from './application/commands';

// Queries
import { VerifySyncHandler } from './application/queries';

// Presentation
import { AdminController } from './presentation';

@Module({
  imports: [
    CqrsModule,
    UsersModule, // Para acesso ao EventStore e UserRehydratorAdapter
    FamiliesModule, // Para acesso ao FamilyRehydratorAdapter
    TasksModule, // Para acesso ao TaskRehydratorAdapter
  ],
  controllers: [AdminController],
  providers: [
    // Command Handlers
    ReplayAllEventsHandler,
    ReplayAggregateEventsHandler,
    ReplayEventsAfterHandler,
    RehydrateAllAggregatesHandler,
    RehydrateAggregateHandler,
    // Query Handlers
    VerifySyncHandler,
  ],
})
export class AdminModule {}
