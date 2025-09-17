import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '../shared';

// Commands
import { RegisterUserHandler, LoginUserHandler } from './application/commands';

// Queries
import { GetUserByIdHandler, GetUsersInfoHandler } from './application/queries';

// Infrastructure
import {
  MongoUserRepository,
  MongoUserReadRepository,
  UserSchema,
  UserSchemaFactory,
} from './infrastructure/persistence';
import { UserMongoEventStore } from './infrastructure/event-store';
import { MongoObjectIdGenerator, BcryptPasswordHasher } from '../shared';

// Domain Services
import { UserFactory } from './domain/services';

// Presentation
import { UsersController } from './presentation';

// Event Handlers
import {
  UserCreatedEventHandler,
  UserLoggedInEventHandler,
  UserCreatedProjection,
  UserLoggedInProjection,
} from './infrastructure/event-bus';

// Event Store Schema
import { Schema } from 'mongoose';

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
    ConfigModule,
    MongooseModule.forFeature(
      [{ name: UserSchema.name, schema: UserSchemaFactory }],
      'writeConnection',
    ),
    MongooseModule.forFeature(
      [{ name: UserSchema.name, schema: UserSchemaFactory }],
      'readConnection',
    ),
    MongooseModule.forFeature([{ name: 'Event', schema: EventSchema }], 'eventsConnection'),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.jwtSecret,
        signOptions: { expiresIn: configService.jwtExpiresIn },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController],
  providers: [
    // Command Handlers
    RegisterUserHandler,
    LoginUserHandler,

    // Query Handlers
    GetUserByIdHandler,
    GetUsersInfoHandler,

    // Repositories
    {
      provide: 'UserRepository',
      useClass: MongoUserRepository,
    },
    {
      provide: 'UserReadRepository',
      useClass: MongoUserReadRepository,
    },
    {
      provide: 'EventStore',
      useClass: UserMongoEventStore,
    },

    // Domain Services
    {
      provide: 'IdGenerator',
      useClass: MongoObjectIdGenerator,
    },
    {
      provide: 'PasswordHasher',
      useClass: BcryptPasswordHasher,
    },
    UserFactory,

    // Event Handlers
    UserCreatedEventHandler,
    UserLoggedInEventHandler,
    UserCreatedProjection,
    UserLoggedInProjection,
  ],
  exports: [
    'UserRepository',
    'UserReadRepository',
    'EventStore',
    'IdGenerator',
    'PasswordHasher',
    UserFactory,
  ],
})
export class UsersModule {}
