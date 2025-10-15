import { FamilyMemberVO } from '../family-member.vo';
import { FamilyResponsibility, FamilyResponsibilityVO } from '../family-responsibility.vo';
import { FamilyRole, FamilyRoleVO } from '../family-role.vo';
import { UserId } from '../../../../users';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('FamilyMemberVO', () => {
  let userId: UserId;
  let role: FamilyRoleVO;
  let responsibility: FamilyResponsibilityVO;
  let joinedAt: Date;

  beforeEach(() => {
    userId = new UserId(makeObjectId());
    role = new FamilyRoleVO(FamilyRole.FATHER);
    responsibility = new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);
    joinedAt = new Date('2024-01-01T00:00:00.000Z');
  });

  describe('constructor', () => {
    it('it should create a FamilyMemberVO with all parameters', () => {
      const member = new FamilyMemberVO(userId, role, responsibility, joinedAt);

      expect(member.userId).toBe(userId);
      expect(member.role).toBe(role);
      expect(member.responsibility).toBe(responsibility);
      expect(member.joinedAt).toBe(joinedAt);
    });

    it('it should use the current date when joinedAt is not provided', () => {
      const beforeCreation = new Date();

      const member = new FamilyMemberVO(userId, role, responsibility);

      const afterCreation = new Date();
      expect(member.joinedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(member.joinedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('canCreateTasksFor', () => {
    it('it should return true when principal responsible creates task for any member', () => {
      const principalResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      const memberResponsible = new FamilyMemberVO(userId, role, principalResponsible);

      const memberResponsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);
      const targetMember = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        memberResponsibility,
      );

      const result = memberResponsible.canCreateTasksFor(targetMember);

      expect(result).toBe(true);
    });

    it('it should return false when member tries to create task for responsible', () => {
      const memberResponsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);
      const member = new FamilyMemberVO(userId, role, memberResponsibility);

      const principalResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      const targetResponsible = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.MOTHER),
        principalResponsible,
      );

      const result = member.canCreateTasksFor(targetResponsible);

      expect(result).toBe(false);
    });
  });

  describe('canRemoveMember', () => {
    it('it should return true when principal responsible removes any member', () => {
      const principalResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      const remover = new FamilyMemberVO(userId, role, principalResponsible);

      const memberToRemove = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      const result = remover.canRemoveMember(memberToRemove);

      expect(result).toBe(true);
    });

    it('it should return true when auxiliary responsible removes common member', () => {
      const auxiliaryResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );
      const remover = new FamilyMemberVO(userId, role, auxiliaryResponsible);

      const memberToRemove = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        new FamilyResponsibilityVO(FamilyResponsibility.MEMBER),
      );

      const result = remover.canRemoveMember(memberToRemove);

      expect(result).toBe(true);
    });

    it('it should return false when auxiliary responsible tries to remove principal responsible', () => {
      const auxiliaryResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );
      const remover = new FamilyMemberVO(userId, role, auxiliaryResponsible);

      const principalResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      const memberToRemove = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.MOTHER),
        principalResponsible,
      );

      const result = remover.canRemoveMember(memberToRemove);

      expect(result).toBe(false);
    });

    it('it should return false when member common tries to remove other member', () => {
      const memberResponsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);
      const remover = new FamilyMemberVO(userId, role, memberResponsibility);

      const memberToRemove = new FamilyMemberVO(
        new UserId(makeObjectId()),
        new FamilyRoleVO(FamilyRole.SON),
        memberResponsibility,
      );

      const result = remover.canRemoveMember(memberToRemove);

      expect(result).toBe(false);
    });
  });

  describe('equals', () => {
    it('it should return true when members have the same userId', () => {
      // Arrange
      const member1 = new FamilyMemberVO(
        userId,
        new FamilyRoleVO(FamilyRole.FATHER),
        new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE),
      );

      const member2 = new FamilyMemberVO(
        userId,
        new FamilyRoleVO(FamilyRole.MOTHER),
        new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE),
      );

      const result = member1.equals(member2);

      expect(result).toBe(true);
    });

    it('it should return false when members have different userIds', () => {
      const member1 = new FamilyMemberVO(userId, role, responsibility);

      const member2 = new FamilyMemberVO(new UserId(makeObjectId()), role, responsibility);

      const result = member1.equals(member2);

      expect(result).toBe(false);
    });
  });
});
