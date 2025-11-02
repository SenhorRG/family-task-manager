import { Injectable } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  FamilyCreatedEvent,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRoleChangedEvent,
  FamilyDeletedEvent,
} from '../../domain/events';
import { FamilyCreatedProjection } from './family-created.projection';
import { MemberAddedProjection } from './member-added.projection';
import { MemberRemovedProjection } from './member-removed.projection';
import { MemberRoleChangedProjection } from './member-role-changed.projection';
import { FamilyDeletedProjection } from './family-deleted.projection';

@Injectable()
@EventsHandler(FamilyCreatedEvent)
export class FamilyCreatedEventHandler implements IEventHandler<FamilyCreatedEvent> {
  constructor(private readonly familyCreatedProjection: FamilyCreatedProjection) {}

  async handle(event: FamilyCreatedEvent): Promise<void> {
    await this.familyCreatedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(MemberAddedEvent)
export class MemberAddedEventHandler implements IEventHandler<MemberAddedEvent> {
  constructor(private readonly memberAddedProjection: MemberAddedProjection) {}

  async handle(event: MemberAddedEvent): Promise<void> {
    await this.memberAddedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(MemberRemovedEvent)
export class MemberRemovedEventHandler implements IEventHandler<MemberRemovedEvent> {
  constructor(private readonly memberRemovedProjection: MemberRemovedProjection) {}

  async handle(event: MemberRemovedEvent): Promise<void> {
    await this.memberRemovedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(MemberRoleChangedEvent)
export class MemberRoleChangedEventHandler implements IEventHandler<MemberRoleChangedEvent> {
  constructor(private readonly memberRoleChangedProjection: MemberRoleChangedProjection) {}

  async handle(event: MemberRoleChangedEvent): Promise<void> {
    await this.memberRoleChangedProjection.handle(event);
  }
}

@Injectable()
@EventsHandler(FamilyDeletedEvent)
export class FamilyDeletedEventHandler implements IEventHandler<FamilyDeletedEvent> {
  constructor(private readonly familyDeletedProjection: FamilyDeletedProjection) {}

  async handle(event: FamilyDeletedEvent): Promise<void> {
    await this.familyDeletedProjection.handle(event);
  }
}
