import { FamilyNameVO } from '../family-name.vo';

describe('FamilyNameVO', () => {
  describe('constructor', () => {
    it('it should create a FamilyNameVO and remove spaces', () => {
      const nameWithSpaces = '  Silva Family  ';

      const familyName = new FamilyNameVO(nameWithSpaces);

      expect(familyName.value).toBe('Silva Family');
    });

    it('it should throw an error when name is empty, null or undefined', () => {
      expect(() => new FamilyNameVO(null as any)).toThrow('Family name cannot be empty');
      expect(() => new FamilyNameVO('')).toThrow('Family name cannot be empty');
      expect(() => new FamilyNameVO(undefined as any)).toThrow('Family name cannot be empty');
    });

    it('it should throw an error when name has less than 2 characters', () => {
      expect(() => new FamilyNameVO('A')).toThrow('Family name must have at least 2 characters');
    });

    it('it should accept name with exactly 2 characters', () => {
      const name = 'AB';

      const familyName = new FamilyNameVO(name);

      expect(familyName.value).toBe('AB');
    });

    it('it should accept name with exactly 100 characters', () => {
      const name = 'A'.repeat(100);

      const familyName = new FamilyNameVO(name);

      expect(familyName.value).toBe(name);
    });

    it('it should throw an error when name has more than 100 characters', () => {
      const name = 'A'.repeat(101);

      expect(() => new FamilyNameVO(name)).toThrow(
        'Family name cannot have more than 100 characters',
      );
    });
  });

  describe('equals', () => {
    it('it should return true when names are equal', () => {
      const name1 = new FamilyNameVO('Silva Family');
      const name2 = new FamilyNameVO('Silva Family');

      const result = name1.equals(name2);

      expect(result).toBe(true);
    });

    it('it should return false when names are different', () => {
      const name1 = new FamilyNameVO('Silva Family');
      const name2 = new FamilyNameVO('Santos Family');

      const result = name1.equals(name2);

      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('it should return the name as a string', () => {
      const nameValue = 'Silva Family';
      const familyName = new FamilyNameVO(nameValue);

      const result = familyName.toString();

      expect(result).toBe(nameValue);
    });
  });
});
