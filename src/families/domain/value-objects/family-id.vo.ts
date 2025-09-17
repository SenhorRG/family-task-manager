export class FamilyId {
  private readonly _value: string;

  constructor(id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('Family ID cannot be empty');
    }
    this._value = id.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: FamilyId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
