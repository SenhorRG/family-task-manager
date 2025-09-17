export class TaskId {
  private readonly _value: string;

  constructor(id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID da tarefa não pode ser vazio');
    }
    this._value = id.trim();
  }

  get value(): string {
    return this._value;
  }

  equals(other: TaskId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
