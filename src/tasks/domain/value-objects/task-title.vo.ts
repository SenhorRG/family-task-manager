export class TaskTitleVO {
  private readonly _value: string;

  constructor(title: string) {
    if (!title || title.trim().length === 0) {
      throw new Error('Task title cannot be empty');
    }
    if (title.trim().length < 3) {
      throw new Error('Task title must have at least 3 characters');
    }
    if (title.trim().length > 200) {
      throw new Error('Task title cannot have more than 200 characters');
    }
    this._value = title.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: TaskTitleVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
