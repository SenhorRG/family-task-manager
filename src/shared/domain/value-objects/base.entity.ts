export abstract class BaseEntity {
  protected _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('ID is required');
    }
    this._id = id.trim();
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  equals(entity: BaseEntity): boolean {
    return this._id === entity._id;
  }
}
