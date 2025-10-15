import { FamilyResponsibility, FamilyResponsibilityVO } from '../family-responsibility.vo';

describe('FamilyResponsibilityVO', () => {
  describe('constructor', () => {
    it('it should create a FamilyResponsibilityVO with a valid responsibility', () => {
      const responsibility = FamilyResponsibility.PRINCIPAL_RESPONSIBLE;

      const familyResponsibility = new FamilyResponsibilityVO(responsibility);

      expect(familyResponsibility.value).toBe(responsibility);
    });
  });

  describe('isResponsible', () => {
    it('it should return true for PRINCIPAL_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);

      const result = responsibility.isResponsible();

      expect(result).toBe(true);
    });

    it('it should return true for AUXILIARY_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE);

      const result = responsibility.isResponsible();

      expect(result).toBe(true);
    });

    it('it should return false for MEMBER', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      const result = responsibility.isResponsible();

      expect(result).toBe(false);
    });
  });

  describe('isPrincipalResponsible', () => {
    it('it should return true for PRINCIPAL_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);

      const result = responsibility.isPrincipalResponsible();

      expect(result).toBe(true);
    });

    it('it should return false for AUXILIARY_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE);

      const result = responsibility.isPrincipalResponsible();

      expect(result).toBe(false);
    });

    it('it should return false for MEMBER', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      const result = responsibility.isPrincipalResponsible();

      expect(result).toBe(false);
    });
  });

  describe('isAuxiliaryResponsible', () => {
    it('it should return false for PRINCIPAL_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);

      const result = responsibility.isAuxiliaryResponsible();

      expect(result).toBe(false);
    });

    it('it should return true AUXILIARY_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE);

      const result = responsibility.isAuxiliaryResponsible();

      expect(result).toBe(true);
    });

    it('it should return false for MEMBER', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      const result = responsibility.isAuxiliaryResponsible();

      expect(result).toBe(false);
    });
  });

  describe('getHierarchyLevel', () => {
    it('it should return level 1 for PRINCIPAL_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);

      const level = responsibility.getHierarchyLevel();

      expect(level).toBe(1);
    });

    it('it should return level 2 for AUXILIARY_RESPONSIBLE', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.AUXILIARY_RESPONSIBLE);

      const level = responsibility.getHierarchyLevel();

      expect(level).toBe(2);
    });

    it('it should return level 3 for MEMBER', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      const level = responsibility.getHierarchyLevel();

      expect(level).toBe(3);
    });
  });

  describe('canCreateTasksFor', () => {
    it('it should return true when principal responsible creates task for any member', () => {
      const principalResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      const targetMember = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      const result = principalResponsible.canCreateTasksFor(targetMember);

      expect(result).toBe(true);
    });

    it('it should return true when an auxiliary responsible creates a task for any member', () => {
      const auxiliaryResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );
      const targetMember = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      const result = auxiliaryResponsible.canCreateTasksFor(targetMember);

      expect(result).toBe(true);
    });

    it('it should return false when member tries to create task for responsible', () => {
      const member = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);
      const targetResponsible = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );

      const result = member.canCreateTasksFor(targetResponsible);

      expect(result).toBe(false);
    });

    it('it should return true when member creates task for another member', () => {
      const member1 = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);
      const member2 = new FamilyResponsibilityVO(FamilyResponsibility.MEMBER);

      const result = member1.canCreateTasksFor(member2);

      expect(result).toBe(true);
    });
  });

  describe('equals', () => {
    it('it should return true when responsibilities are equal', () => {
      const responsibility1 = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      const responsibility2 = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );

      const result = responsibility1.equals(responsibility2);

      expect(result).toBe(true);
    });

    it('it should return false when responsibilities are different', () => {
      const responsibility1 = new FamilyResponsibilityVO(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      const responsibility2 = new FamilyResponsibilityVO(
        FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      );

      const result = responsibility1.equals(responsibility2);

      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('it should return the responsibility as a string', () => {
      const responsibility = new FamilyResponsibilityVO(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);

      const result = responsibility.toString();

      expect(result).toBe(FamilyResponsibility.PRINCIPAL_RESPONSIBLE);
    });
  });
});
