import { Inject, Injectable } from '@nestjs/common';
import { Family } from '../aggregates';
import {
  FamilyId,
  FamilyMemberVO,
  FamilyNameVO,
  FamilyResponsibility,
  FamilyResponsibilityVO,
  FamilyRole,
  FamilyRoleVO,
} from '../value-objects';
import { IdGenerator, BaseEvent } from '../../../shared';
import { UserId } from '../../../users/domain/value-objects';
import { FamilyCreatedEvent } from '../events';

@Injectable()
export class FamilyFactory {
  constructor(@Inject('IdGenerator') private readonly idGenerator: IdGenerator) {}

  createFamily(
    name: string,
    principalResponsibleUserId: string,
    principalRole: FamilyRole,
  ): Family {
    const familyId = new FamilyId(this.idGenerator.generate());
    const familyName = new FamilyNameVO(name);
    const principalUserId = new UserId(principalResponsibleUserId);
    const roleVO = new FamilyRoleVO(principalRole);
    const responsibilityVO = new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);
    const principalMember = new FamilyMemberVO(principalUserId, roleVO, responsibilityVO);

    return new Family(familyId, familyName, principalMember);
  }

  createFamilyFromPersistence(
    id: string,
    name: string,
    members: Array<{
      userId: string;
      role: string;
      responsibility: string;
      joinedAt: Date;
    }>,
    createdAt: Date,
    updatedAt: Date,
  ): Family {
    const familyId = new FamilyId(id);
    const familyName = new FamilyNameVO(name);

    const familyMembers = members.map((member) => {
      const userId = new UserId(member.userId);
      const role = new FamilyRoleVO(member.role as FamilyRole);
      const responsibility = new FamilyResponsibilityVO(
        member.responsibility as FamilyResponsibility,
      );
      return new FamilyMemberVO(userId, role, responsibility, member.joinedAt);
    });

    return new Family(familyId, familyName, familyMembers[0], familyMembers, createdAt, updatedAt);
  }

  reconstructFamilyFromEvents(aggregateId: string, events: BaseEvent[]): Family {
    if (events.length === 0) {
      throw new Error(`No events found for family ${aggregateId}`);
    }

    const firstEvent = events[0];
    if (!(firstEvent instanceof FamilyCreatedEvent)) {
      throw new Error(`First event must be FamilyCreatedEvent, but got ${firstEvent.eventType}`);
    }

    const familyId = new FamilyId(aggregateId);
    const familyName = new FamilyNameVO(firstEvent.eventData.name);
    const principalUserId = new UserId(firstEvent.eventData.principalResponsibleUserId);
    const principalRole = new FamilyRoleVO(firstEvent.eventData.principalRole as FamilyRole);
    const principalResponsibility = new FamilyResponsibilityVO(
      FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
    );
    const principalMember = new FamilyMemberVO(
      principalUserId,
      principalRole,
      principalResponsibility,
    );

    const family = new Family(
      familyId,
      familyName,
      principalMember,
      [principalMember],
      firstEvent.eventData.createdAt,
      firstEvent.occurredOn,
    );

    const remainingEvents = events.slice(1);
    if (remainingEvents.length > 0) {
      family.loadFromHistory(remainingEvents);
    }

    return family;
  }
}
