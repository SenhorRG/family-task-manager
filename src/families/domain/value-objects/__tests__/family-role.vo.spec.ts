import { FamilyRole, FamilyRoleVO } from '../family-role.vo';

describe('FamilyRoleVO', () => {
  describe('constructor', () => {
    it('it should create a FamilyRoleVO with a valid role', () => {
      const role = FamilyRole.FATHER;

      const familyRole = new FamilyRoleVO(role);

      expect(familyRole.value).toBe(role);
    });
  });

  describe('getHierarchyLevel', () => {
    it('it should return level 1 for GRANDFATHER', () => {
      const role = new FamilyRoleVO(FamilyRole.GRANDFATHER);

      const level = role.getHierarchyLevel();

      expect(level).toBe(1);
    });

    it('it should return level 1 for GRANDMOTHER', () => {
      const role = new FamilyRoleVO(FamilyRole.GRANDMOTHER);

      const level = role.getHierarchyLevel();

      expect(level).toBe(1);
    });

    it('it should return level 2 for FATHER', () => {
      const role = new FamilyRoleVO(FamilyRole.FATHER);

      const level = role.getHierarchyLevel();

      expect(level).toBe(2);
    });

    it('it should return level 2 for MOTHER', () => {
      const role = new FamilyRoleVO(FamilyRole.MOTHER);

      const level = role.getHierarchyLevel();

      expect(level).toBe(2);
    });

    it('it should return level 3 for SON', () => {
      const role = new FamilyRoleVO(FamilyRole.SON);

      const level = role.getHierarchyLevel();

      expect(level).toBe(3);
    });

    it('it should return level 3 for DAUGHTER', () => {
      const role = new FamilyRoleVO(FamilyRole.DAUGHTER);

      const level = role.getHierarchyLevel();

      expect(level).toBe(3);
    });

    it('it should return level 4 for MEMBER', () => {
      const role = new FamilyRoleVO(FamilyRole.MEMBER);

      const level = role.getHierarchyLevel();

      expect(level).toBe(4);
    });
  });

  describe('equals', () => {
    it('it should return true when roles are equal', () => {
      const role1 = new FamilyRoleVO(FamilyRole.FATHER);
      const role2 = new FamilyRoleVO(FamilyRole.FATHER);

      const result = role1.equals(role2);

      expect(result).toBe(true);
    });

    it('it should return false when roles are differents', () => {
      const role1 = new FamilyRoleVO(FamilyRole.FATHER);
      const role2 = new FamilyRoleVO(FamilyRole.MOTHER);

      const result = role1.equals(role2);

      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('it should return the role as a string', () => {
      const role = new FamilyRoleVO(FamilyRole.FATHER);

      const result = role.toString();

      expect(result).toBe(FamilyRole.FATHER);
    });
  });
});
