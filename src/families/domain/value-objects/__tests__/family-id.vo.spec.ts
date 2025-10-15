import { FamilyId } from '../family-id.vo';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('FamilyId', () => {
  describe('constructor', () => {
    it('it should create a FamilyId with a valid value and remove spaces', () => {
      const idWithSpaces = '  ' + makeObjectId() + '  ';

      const familyId = new FamilyId(idWithSpaces);

      expect(familyId.value).toBe(idWithSpaces.trim());
    });

    it('it should throw an error when ID is empty', () => {
      expect(() => new FamilyId('')).toThrow('Family ID cannot be empty');
    });
  });

  describe('equals', () => {
    it('it should return true when IDs are equal', () => {
      const id1 = new FamilyId(makeObjectId());
      const id2 = id1;

      const result = id1.equals(id2);

      expect(result).toBe(true);
    });

    it('it should return false when IDs are different', () => {
      const id1 = new FamilyId(makeObjectId());
      const id2 = new FamilyId(makeObjectId());

      const result = id1.equals(id2);

      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('it should return the value of the ID as a string', () => {
      const idValue = makeObjectId();
      const familyId = new FamilyId(idValue);

      const result = familyId.toString();

      expect(result).toBe(idValue);
    });
  });
});
