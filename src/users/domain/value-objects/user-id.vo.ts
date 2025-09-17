export class UserId {
  private readonly _value: string;

  constructor(id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }
    this._value = id.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
