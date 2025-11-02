import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { UserLoggedInEvent } from '../../domain/events/user-logged-in.event';
import { UserDeletedEvent } from '../../domain/events/user-deleted.event';
import { UserCreatedProjection } from './user-created.projection';
import { UserLoggedInProjection } from './user-logged-in.projection';
import { UserDeletedProjection } from './user-deleted.projection';

@Injectable()
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  constructor(private readonly userCreatedProjection: UserCreatedProjection) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    await this.userCreatedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(UserLoggedInEvent)
export class UserLoggedInEventHandler implements IEventHandler<UserLoggedInEvent> {
  constructor(private readonly userLoggedInProjection: UserLoggedInProjection) {}

  async handle(event: UserLoggedInEvent): Promise<void> {
    await this.userLoggedInProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(UserDeletedEvent)
export class UserDeletedEventHandler implements IEventHandler<UserDeletedEvent> {
  constructor(private readonly userDeletedProjection: UserDeletedProjection) {}

  async handle(event: UserDeletedEvent): Promise<void> {
    await this.userDeletedProjection.handle(event);
  }
}
