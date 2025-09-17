export class TaskDescriptionVO {
  private readonly _value: string;

  constructor(description: string) {
    if (!description || description.trim().length === 0) {
      throw new Error('Task description cannot be empty');
    }
    if (description.trim().length < 10) {
      throw new Error('Task description must have at least 10 characters');
    }
    if (description.trim().length > 1000) {
      throw new Error('Task description cannot have more than 1000 characters');
    }
    this._value = description.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: TaskDescriptionVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
