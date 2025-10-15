import { Family } from '../family.aggregate';
import { UserId } from '../../../../users';
import {
  FamilyId,
  FamilyMemberVO,
  FamilyNameVO,
  FamilyRole,
  FamilyRoleVO,
  FamilyResponsibility,
  FamilyResponsibilityVO,
} from '../../value-objects';
import {
  FamilyCreatedEvent,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRoleChangedEvent,
} from '../../events';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('Family', () => {
  let familyId: FamilyId;
  let familyName: FamilyNameVO;
  let principalResponsible: FamilyMemberVO;

  beforeEach(() => {
    familyId = new FamilyId(makeObjectId());
    familyName = new FamilyNameVO('Silva Family');
    principalResponsible = new FamilyMemberVO(
      new UserId(makeObjectId()),
      new FamilyRoleVO(FamilyRole.FATHER),
      new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE),
    );
  });

  describe('constructor', () => {
    it('it should create a family with valid data', () => {
      const family = new Family(familyId, familyName, principalResponsible);

      expect(family.familyId).toEqual(familyId);
      expect(family.name).toEqual(familyName);
      expect(family.principalResponsible).toEqual(principalResponsible);
      expect(family.members).toHaveLength(1);
      expect(family.members[0]).toEqual(principalResponsible);
    });

    it('it should add FamilyCreatedEvent when a new family is created', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      expect(family.uncommittedEvents).toHaveLength(1);
      expect(family.uncommittedEvents[0]).toBeInstanceOf(FamilyCreatedEvent);

      const event = family.uncommittedEvents[0] as FamilyCreatedEvent;

      expect(event.aggregateId).toEqual(familyId.value);
      expect(event.eventData.name).toEqual(familyName.value);
      expect(event.eventData.principalResponsibleUserId).toEqual(principalResponsible.userId.value);
      expect(event.eventData.principalRole).toEqual(principalResponsible.role.value);
    });
  });

  describe('getResponsibleMembers', () => {
    it('it should return the responsible members', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const auxiliaryResponsible = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.MOTHER),
        new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE),
      );
      const member = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        member.userId,
        member.role,
        member.responsibility,
        principalResponsible.userId,
      );
      family.addMember(
        auxiliaryResponsible.userId,
        auxiliaryResponsible.role,
        auxiliaryResponsible.responsibility,
        principalResponsible.userId,
      );

      const responsibleMembers = family.getResponsibleMembers();

      expect(responsibleMembers).toHaveLength(2);
      expect(responsibleMembers.some((m) => m.isPrincipalResponsible())).toBe(true);
      expect(responsibleMembers.some((m) => m.isAuxiliaryResponsible())).toBe(true);
    });
  });

  describe('getAuxiliaryResponsibleMembers', () => {
    it('it should return the auxiliary responsible members', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const auxiliaryResponsible = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.MOTHER),
        new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE),
      );
      family.addMember(
        auxiliaryResponsible.userId,
        auxiliaryResponsible.role,
        auxiliaryResponsible.responsibility,
        principalResponsible.userId,
      );

      const auxiliaryMembers = family.getAuxiliaryResponsibleMembers();

      expect(auxiliaryMembers).toHaveLength(1);
      expect(auxiliaryMembers[0].isAuxiliaryResponsible()).toBe(true);
    });
  });

  describe('addMember', () => {
    it('it should add a member to the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const newUserId = new UserId(makeObjectId());
      const newRole = new FamilyRoleVO(FamilyRole.SON);
      const newResponsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      family.addMember(newUserId, newRole, newResponsibility, principalResponsible.userId);

      expect(family.members).toHaveLength(2);
      expect(family.isMember(newUserId)).toBe(true);

      const events = family.uncommittedEvents;

      const memberAddedEvent = events.find(
        (e) => e instanceof MemberAddedEvent,
      ) as MemberAddedEvent;

      expect(memberAddedEvent).toBeDefined();
      expect(memberAddedEvent.eventData.userId).toEqual(newUserId.value);
    });

    it('it should throw an error when user does not have permission to add member', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const regularMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        regularMember.userId,
        regularMember.role,
        regularMember.responsibility,
        principalResponsible.userId,
      );

      const newUserId = new UserId(makeObjectId());
      const newRole = new FamilyRoleVO(FamilyRole.DAUGHTER);
      const newResponsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      expect(() => {
        family.addMember(newUserId, newRole, newResponsibility, regularMember.userId);
      }).toThrow('User does not have permission to add members to the family');
    });

    it('it should throw an error when user is already a member of the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const newRole = new FamilyRoleVO(FamilyRole.SON);
      const newResponsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      expect(() => {
        family.addMember(
          principalResponsible.userId,
          newRole,
          newResponsibility,
          principalResponsible.userId,
        );
      }).toThrow('User is already a member of the family');
    });

    it('it should throw an error when number of auxiliary responsible members is exceeded', () => {
      const family = new Family(familyId, familyName, principalResponsible);

      const auxiliary1 = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.MOTHER),
        new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE),
      );
      family.addMember(
        auxiliary1.userId,
        auxiliary1.role,
        auxiliary1.responsibility,
        principalResponsible.userId,
      );

      const auxiliary2 = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.GRANDMOTHER),
        new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE),
      );
      family.addMember(
        auxiliary2.userId,
        auxiliary2.role,
        auxiliary2.responsibility,
        principalResponsible.userId,
      );

      const auxiliary3 = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.GRANDFATHER),
        new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE),
      );

      expect(() => {
        family.addMember(
          auxiliary3.userId,
          auxiliary3.role,
          auxiliary3.responsibility,
          principalResponsible.userId,
        );
      }).toThrow('Maximum number of auxiliary responsible members reached');
    });
  });

  describe('removeMember', () => {
    it('it should remove a member from the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const memberToRemove = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        memberToRemove.userId,
        memberToRemove.role,
        memberToRemove.responsibility,
        principalResponsible.userId,
      );

      family.removeMember(memberToRemove.userId, principalResponsible.userId);

      expect(family.members).toHaveLength(1);
      expect(family.isMember(memberToRemove.userId)).toBe(false);

      const events = family.uncommittedEvents;

      const memberRemovedEvent = events.find(
        (e) => e instanceof MemberRemovedEvent,
      ) as MemberRemovedEvent;

      expect(memberRemovedEvent).toBeDefined();
      expect(memberRemovedEvent.eventData.userId).toEqual(memberToRemove.userId.value);
    });

    it('it should throw an error when user does not have permission to remove member', () => {
      const family = new Family(familyId, familyName, principalResponsible);

      const regularMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        regularMember.userId,
        regularMember.role,
        regularMember.responsibility,
        principalResponsible.userId,
      );

      const anotherMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.DAUGHTER),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        anotherMember.userId,
        anotherMember.role,
        anotherMember.responsibility,
        principalResponsible.userId,
      );

      expect(() => {
        family.removeMember(anotherMember.userId, regularMember.userId);
      }).toThrow('User does not have permission to remove members from the family');
    });

    it('it should throw an error when member is not found in the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const memberToRemove = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      expect(() => {
        family.removeMember(memberToRemove.userId, principalResponsible.userId);
      }).toThrow('Member not found in the family');
    });

    it('it should throw an error when an auxiliary responsible member try to remove a principal responsible', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const auxiliaryMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.MOTHER),
        new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE),
      );

      family.addMember(
        auxiliaryMember.userId,
        auxiliaryMember.role,
        auxiliaryMember.responsibility,
        principalResponsible.userId,
      );

      expect(() => {
        family.removeMember(principalResponsible.userId, auxiliaryMember.userId);
      }).toThrow('User does not have permission to remove this member');
    });
  });

  describe('changeMemberRole', () => {
    it('it should change the role of a member', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const memberToChange = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        memberToChange.userId,
        memberToChange.role,
        memberToChange.responsibility,
        principalResponsible.userId,
      );

      const newRole = new FamilyRoleVO(FamilyRole.FATHER);
      const newResponsibility = new FamilyResponsibilityVO(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );

      family.changeMemberRole(
        memberToChange.userId,
        newRole,
        newResponsibility,
        principalResponsible.userId,
      );

      const updatedMember = family.getMember(memberToChange.userId);
      expect(updatedMember?.role.value).toEqual(FamilyRole.FATHER);
      expect(updatedMember?.responsibility.value).toEqual(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );

      const events = family.uncommittedEvents;
      const roleChangedEvent = events.find(
        (e) => e instanceof MemberRoleChangedEvent,
      ) as MemberRoleChangedEvent;

      expect(roleChangedEvent).toBeDefined();
      expect(roleChangedEvent.eventData.userId).toEqual(memberToChange.userId.value);
      expect(roleChangedEvent.eventData.newRole).toEqual(FamilyRole.FATHER);
      expect(roleChangedEvent.eventData.newResponsibility).toEqual(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );
    });

    it('it should throw an error when user does not have permission to change member role', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const regularMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        regularMember.userId,
        regularMember.role,
        regularMember.responsibility,
        principalResponsible.userId,
      );

      const newRole = new FamilyRoleVO(FamilyRole.FATHER);
      const newResponsibility = new FamilyResponsibilityVO(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );

      expect(() => {
        family.changeMemberRole(
          principalResponsible.userId,
          newRole,
          newResponsibility,
          regularMember.userId,
        );
      }).toThrow('User does not have permission to change roles');
    });

    it('it should throw an error when member is not found in the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const memberToChange = new UserId(makeObjectId());

      const newRole = new FamilyRoleVO(FamilyRole.FATHER);
      const newResponsibility = new FamilyResponsibilityVO(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );

      expect(() => {
        family.changeMemberRole(
          memberToChange,
          newRole,
          newResponsibility,
          principalResponsible.userId,
        );
      }).toThrow('Member not found in the family');
    });
  });

  describe('isMember', () => {
    it('it should return true when user is a member of the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);

      expect(family.isMember(principalResponsible.userId)).toBe(true);
    });

    it('it should return false when user is not a member of the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const nonFamilyMember = new UserId(makeObjectId());

      expect(family.isMember(nonFamilyMember)).toBe(false);
    });
  });

  describe('getMember', () => {
    it('it should return the member when user is a member of the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);

      const member = family.getMember(principalResponsible.userId);

      expect(member).toEqual(principalResponsible);
    });

    it('it should return null when user is not a member of the family', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const nonFamilyMember = new UserId(makeObjectId());

      const member = family.getMember(nonFamilyMember);

      expect(member).toBeNull();
    });
  });

  describe('canCreateTaskFor', () => {
    it('it should return true when user can create task for another member', () => {
      const family = new Family(familyId, familyName, principalResponsible);

      const targetMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        targetMember.userId,
        targetMember.role,
        targetMember.responsibility,
        principalResponsible.userId,
      );

      const canCreate = family.canCreateTaskFor(principalResponsible.userId, targetMember.userId);

      expect(canCreate).toBe(true);
    });

    it('it should return false when user cannot create task for another member', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const regularMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      family.addMember(
        regularMember.userId,
        regularMember.role,
        regularMember.responsibility,
        principalResponsible.userId,
      );

      const canCreate = family.canCreateTaskFor(regularMember.userId, principalResponsible.userId);

      expect(canCreate).toBe(false);
    });

    it('it should return false when creator is not a member', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const nonFamilyMember = new UserId(makeObjectId());

      const canCreate = family.canCreateTaskFor(nonFamilyMember, principalResponsible.userId);

      expect(canCreate).toBe(false);
    });

    it('it should return false when target is not a member', () => {
      const family = new Family(familyId, familyName, principalResponsible);
      const nonFamilyMember = new UserId(makeObjectId());

      const canCreate = family.canCreateTaskFor(principalResponsible.userId, nonFamilyMember);

      expect(canCreate).toBe(false);
    });
  });
});
