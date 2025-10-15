import { randomBytes } from 'crypto';
import { FamilyReadDto } from '../family-read.dto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('FamilyReadDto', () => {
  describe('constructor', () => {
    it('it should create a FamilyReadDto with the correct values', () => {
      const familyId = makeObjectId();
      const name = 'Silva Family';
      const members = [
        {
          userId: makeObjectId(),
          memberName: 'João Silva',
          role: 'FATHER',
          responsibility: 'PRINCIPAL_RESPONSIBLE',
          joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          userId: makeObjectId(),
          memberName: 'Maria Silva',
          role: 'MOTHER',
          responsibility: 'AUXILIARY_RESPONSIBLE',
          joinedAt: new Date('2024-01-02T00:00:00.000Z'),
        },
      ];
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const updatedAt = new Date('2024-01-15T00:00:00.000Z');

      const familyReadDto = new FamilyReadDto(familyId, name, members, createdAt, updatedAt);

      expect(familyReadDto.id).toBe(familyId);
      expect(familyReadDto.name).toBe(name);
      expect(familyReadDto.members).toBe(members);
      expect(familyReadDto.createdAt).toBe(createdAt);
      expect(familyReadDto.updatedAt).toBe(updatedAt);
      expect(familyReadDto).toBeDefined();
    });
  });
});
