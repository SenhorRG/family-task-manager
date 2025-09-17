export enum FamilyRole {
  GRANDFATHER = 'GRANDFATHER',
  GRANDMOTHER = 'GRANDMOTHER',
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  SON = 'SON',
  DAUGHTER = 'DAUGHTER',
  MEMBER = 'MEMBER',
}

export class FamilyRoleVO {
  private readonly _value: FamilyRole;

  constructor(role: FamilyRole) {
    this._value = role;
  }

  get value(): FamilyRole {
    return this._value;
  }

  equals(other: FamilyRoleVO): boolean {
    return this._value === other._value;
  }

  getHierarchyLevel(): number {
    const hierarchy = {
      [FamilyRole.GRANDFATHER]: 1,
      [FamilyRole.GRANDMOTHER]: 1,
      [FamilyRole.FATHER]: 2,
      [FamilyRole.MOTHER]: 2,
      [FamilyRole.SON]: 3,
      [FamilyRole.DAUGHTER]: 3,
      [FamilyRole.MEMBER]: 4,
    };
    return hierarchy[this._value];
  }

  toString(): string {
    return this._value;
  }
}
