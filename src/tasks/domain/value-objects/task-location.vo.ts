export class TaskLocationVO {
  private readonly _value: string;

  constructor(location: string) {
    if (location && location.trim().length > 200) {
      throw new Error('Task location cannot have more than 200 characters');
    }
    this._value = location ? location.trim() : '';
  }

  get value(): string {
    return this._value;
  }

  hasLocation(): boolean {
    return this._value.length > 0;
  }

  equals(other: TaskLocationVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
