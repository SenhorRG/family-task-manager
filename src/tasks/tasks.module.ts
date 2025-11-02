import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FamiliesModule } from '../families';
import { UsersModule } from '../users';
import { AuthModule } from '../shared/infrastructure/auth';

// Commands
import {
  CreateTaskHandler,
  UpdateTaskHandler,
  ChangeTaskStatusHandler,
  AddTaskAssignmentHandler,
  RemoveTaskAssignmentHandler,
} from './application/commands';

// Queries
import {
  GetTaskByIdHandler,
  GetTasksByFamilyHandler,
  GetTasksByUserHandler,
} from './application/queries';

// Infrastructure
import {
  MongoTaskRepository,
  MongoTaskReadRepository,
} from './infrastructure/persistence/mongoose/repositories';
import { MongoObjectIdGenerator } from '../shared';
import { TaskMongoEventStore } from './infrastructure/event-store';

// Domain Services
import { TaskFactory } from './domain/services';

// Application Services
import { TaskRehydratorAdapter } from './application/services/task-rehydrator.adapter';

// Schemas
import { TaskSchema, TaskSchemaFactory } from './infrastructure/persistence/mongoose/schemas';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';

// Presentation
import { TasksController } from './presentation/http';

// Event Handlers
import {
  TaskCreatedEventHandler,
  TaskUpdatedEventHandler,
  TaskStatusChangedEventHandler,
  TaskAssignmentAddedEventHandler,
  TaskAssignmentRemovedEventHandler,
  TaskDeletedEventHandler,
  TaskCreatedProjection,
  TaskUpdatedProjection,
  TaskStatusChangedProjection,
  TaskAssignmentAddedProjection,
  TaskAssignmentRemovedProjection,
  TaskDeletedProjection,
} from './infrastructure/event-bus';

const EventSchema = new Schema({
  eventType: { type: String, required: true },
  aggregateId: { type: String, required: true },
  aggregateType: { type: String, required: true },
  eventData: { type: Schema.Types.Mixed, required: true },
  occurredOn: { type: Date, required: true },
  version: { type: Number, required: true },
});

// Adicionar índices para melhorar performance
EventSchema.index({ aggregateId: 1, version: 1 }); // Compound index para queries por aggregate e versão
EventSchema.index({ aggregateId: 1 }); // Index para queries por aggregate
EventSchema.index({ occurredOn: 1 }); // Index para ordenação cronológica
EventSchema.index({ eventType: 1 }); // Index para filtros por tipo de evento
EventSchema.index({ aggregateType: 1 }); // Index para filtros por tipo de aggregate

@Module({
  imports: [
    CqrsModule,
    FamiliesModule,
    UsersModule,
    AuthModule,
    MongooseModule.forFeature(
      [{ name: TaskSchema.name, schema: TaskSchemaFactory }],
      'writeConnection',
    ),
    MongooseModule.forFeature(
      [{ name: TaskSchema.name, schema: TaskSchemaFactory }],
      'readConnection',
    ),
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }], 'eventsConnection'),
  ],
  controllers: [TasksController],
  providers: [
    // Command Handlers
    CreateTaskHandler,
    UpdateTaskHandler,
    ChangeTaskStatusHandler,
    AddTaskAssignmentHandler,
    RemoveTaskAssignmentHandler,

    // Query Handlers
    GetTaskByIdHandler,
    GetTasksByFamilyHandler,
    GetTasksByUserHandler,

    // Repositories
    {
      provide: 'TaskRepository',
      useClass: MongoTaskRepository,
    },
    {
      provide: 'TaskReadRepository',
      useClass: MongoTaskReadRepository,
    },
    {
      provide: 'EventStore',
      useClass: TaskMongoEventStore,
    },

    // Domain Services
    {
      provide: 'IdGenerator',
      useClass: MongoObjectIdGenerator,
    },
    TaskFactory,

    // Application Services
    TaskRehydratorAdapter,

    // Event Handlers
    TaskCreatedEventHandler,
    TaskUpdatedEventHandler,
    TaskStatusChangedEventHandler,
    TaskAssignmentAddedEventHandler,
    TaskAssignmentRemovedEventHandler,
    TaskDeletedEventHandler,
    TaskCreatedProjection,
    TaskUpdatedProjection,
    TaskStatusChangedProjection,
    TaskAssignmentAddedProjection,
    TaskAssignmentRemovedProjection,
    TaskDeletedProjection,
  ],
  exports: [
    'TaskRepository',
    'TaskReadRepository',
    'EventStore',
    'IdGenerator',
    TaskFactory,
    TaskRehydratorAdapter,
  ],
})
export class TasksModule {}
