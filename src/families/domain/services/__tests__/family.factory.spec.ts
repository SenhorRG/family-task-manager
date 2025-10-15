import { FamilyFactory } from '../family.factory';
import { FamilyResponsibility, FamilyRole } from '../../value-objects';
import { IdGenerator } from '../../../../shared';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');

describe('FamilyFactory', () => {
  let factory: FamilyFactory;
  let mockIdGenerator: jest.Mocked<IdGenerator>;

  beforeEach(() => {
    mockIdGenerator = {
      generate: jest.fn(),
    };
    factory = new FamilyFactory(mockIdGenerator);
  });

  describe('createFamily', () => {
    it('it should create a family with valid data', () => {
      const name = 'Silva Family';
      const principalResponsibleUserId = makeObjectId();
      const principalRole = FamilyRole.FATHER;
      const generatedId = makeObjectId();

      mockIdGenerator.generate.mockReturnValue(generatedId);

      const family = factory.createFamily(name, principalResponsibleUserId, principalRole);

      expect(mockIdGenerator.generate).toHaveBeenCalledTimes(1);
      expect(family.familyId.value).toBe(generatedId);
      expect(family.name.value).toBe(name);
      expect(family.principalResponsible.userId.value).toBe(principalResponsibleUserId);
      expect(family.principalResponsible.role.value).toBe(principalRole);
      expect(family.principalResponsible.responsibility.value).toBe(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
      expect(family.members).toHaveLength(1);
      expect(family.members[0]).toBe(family.principalResponsible);
    });
  });

  describe('createFamilyFromPersistence', () => {
    it('it should create a family from persistence data', () => {
      const id = makeObjectId();
      const name = 'Silva Family';
      const members = [
        {
          userId: makeObjectId(),
          role: FamilyRole.FATHER,
          responsibility: FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
          joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          userId: makeObjectId(),
          role: FamilyRole.MOTHER,
          responsibility: FamilyResponsibility.AUXILIARY_RESPONSIBLE,
          joinedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ];
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const updatedAt = new Date('2024-01-03T00:00:00.000Z');

      const family = factory.createFamilyFromPersistence(id, name, members, createdAt, updatedAt);

      expect(family.familyId.value).toBe(id);
      expect(family.name.value).toBe(name);
      expect(family.createdAt).toEqual(createdAt);
      expect(family.updatedAt).toEqual(updatedAt);
      expect(family.members).toHaveLength(2);
      expect(family.principalResponsible.userId.value).toBe(members[0].userId);
      expect(family.principalResponsible.role.value).toBe(FamilyRole.FATHER);
      expect(family.principalResponsible.responsibility.value).toBe(
        FamilyResponsibility.PRINCIPAL_RESPONSIBLE,
      );
    });
  });
});
