export class FamilyNameVO {
  private readonly _value: string;

  constructor(name: string) {
    if (!name || name.trim().length === 0) {
      throw new Error('Family name cannot be empty');
    }
    if (name.trim().length < 2) {
      throw new Error('Family name must have at least 2 characters');
    }
    if (name.trim().length > 100) {
      throw new Error('Family name cannot have more than 100 characters');
    }
    this._value = name.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: FamilyNameVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
