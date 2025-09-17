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
import { IdGenerator } from '../../../shared/domain/ports';
import { UserId } from '../../../users/domain/value-objects';

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
}
