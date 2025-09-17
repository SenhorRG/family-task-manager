export class FullName {
  private readonly _value: string;

  constructor(fullName: string) {
    if (!this.isValid(fullName)) {
      throw new Error('Invalid full name');
    }
    this._value = fullName.trim();
  }

  get value(): string {
    return this._value;
  }

  private isValid(fullName: string): boolean {
    if (!fullName || fullName.trim().length < 2) {
      return false;
    }

    const parts = fullName
      .trim()
      .split(' ')
      .filter((part) => part.length > 0);
    return parts.length >= 2;
  }

  equals(other: FullName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
