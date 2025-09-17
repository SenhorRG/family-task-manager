import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../shared/infrastructure/auth';

// Commands
import {
  CreateFamilyHandler,
  AddMemberHandler,
  RemoveMemberHandler,
  ChangeMemberRoleHandler,
} from './application/commands';

// Queries
import { GetFamilyByIdHandler, GetFamiliesByUserHandler } from './application/queries';

// Infrastructure
import {
  MongoFamilyRepository,
  MongoFamilyReadRepository,
} from './infrastructure/persistence/mongoose/repositories';
import { MongoObjectIdGenerator } from '../shared';
import { FamilyMongoEventStore } from './infrastructure/event-store';

// Domain Services
import { FamilyFactory } from './domain/services';

// Schemas
import { FamilySchema, FamilySchemaFactory } from './infrastructure/persistence/mongoose/schemas';
import { Schema } from 'mongoose';

// Presentation
import { FamiliesController } from './presentation/http';

// Event Handlers
import {
  FamilyCreatedEventHandler,
  MemberAddedEventHandler,
  MemberRemovedEventHandler,
  MemberRoleChangedEventHandler,
  FamilyCreatedProjection,
  MemberAddedProjection,
  MemberRemovedProjection,
  MemberRoleChangedProjection,
} from './infrastructure/event-bus';

const EventSchema = new Schema({
  eventType: { type: String, required: true },
  aggregateId: { type: String, required: true },
  aggregateType: { type: String, required: true },
  eventData: { type: Schema.Types.Mixed, required: true },
  occurredOn: { type: Date, required: true },
  version: { type: Number, required: true },
});

@Module({
  imports: [
    CqrsModule,
    UsersModule,
    AuthModule,
    MongooseModule.forFeature(
      [{ name: FamilySchema.name, schema: FamilySchemaFactory }],
      'writeConnection',
    ),
    MongooseModule.forFeature(
      [{ name: FamilySchema.name, schema: FamilySchemaFactory }],
      'readConnection',
    ),
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }], 'eventsConnection'),
  ],
  controllers: [FamiliesController],
  providers: [
    // Command Handlers
    CreateFamilyHandler,
    AddMemberHandler,
    RemoveMemberHandler,
    ChangeMemberRoleHandler,

    // Query Handlers
    GetFamilyByIdHandler,
    GetFamiliesByUserHandler,

    // Repositories
    {
      provide: 'FamilyRepository',
      useClass: MongoFamilyRepository,
    },
    {
      provide: 'FamilyReadRepository',
      useClass: MongoFamilyReadRepository,
    },
    {
      provide: 'EventStore',
      useClass: FamilyMongoEventStore,
    },

    // Domain Services
    {
      provide: 'IdGenerator',
      useClass: MongoObjectIdGenerator,
    },
    FamilyFactory,

    // Event Handlers
    FamilyCreatedEventHandler,
    MemberAddedEventHandler,
    MemberRemovedEventHandler,
    MemberRoleChangedEventHandler,
    FamilyCreatedProjection,
    MemberAddedProjection,
    MemberRemovedProjection,
    MemberRoleChangedProjection,
  ],
  exports: ['FamilyRepository', 'FamilyReadRepository', 'EventStore', 'IdGenerator', FamilyFactory],
})
export class FamiliesModule {}
