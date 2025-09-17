export enum FamilyResponsibility {
  PRINCIPAL_RESPONSIBLE = 'PRINCIPAL_RESPONSIBLE',
  AUXILIARY_RESPONSIBLE = 'AUXILIARY_RESPONSIBLE',
  MEMBER = 'MEMBER',
}

export class FamilyResponsibilityVO {
  private readonly _value: FamilyResponsibility;

  constructor(responsibility: FamilyResponsibility) {
    this._value = responsibility;
  }

  get value(): FamilyResponsibility {
    return this._value;
  }

  equals(other: FamilyResponsibilityVO): boolean {
    return this._value === other._value;
  }

  isResponsible(): boolean {
    return (
      this._value === FamilyResponsibility.PRINCIPAL_RESPONSIBLE ||
      this._value === FamilyResponsibility.AUXILIARY_RESPONSIBLE
    );
  }

  isPrincipalResponsible(): boolean {
    return this._value === FamilyResponsibility.PRINCIPAL_RESPONSIBLE;
  }

  isAuxiliaryResponsible(): boolean {
    return this._value === FamilyResponsibility.AUXILIARY_RESPONSIBLE;
  }

  getHierarchyLevel(): number {
    const hierarchy = {
      [FamilyResponsibility.PRINCIPAL_RESPONSIBLE]: 1,
      [FamilyResponsibility.AUXILIARY_RESPONSIBLE]: 2,
      [FamilyResponsibility.MEMBER]: 3,
    };
    return hierarchy[this._value];
  }

  canCreateTasksFor(responsibility: FamilyResponsibilityVO): boolean {
    if (this.isResponsible()) {
      return true;
    }
    return this.getHierarchyLevel() <= responsibility.getHierarchyLevel();
  }

  toString(): string {
    return this._value;
  }
}
