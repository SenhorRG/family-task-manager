import { UserId } from '../../../users/domain/value-objects/user-id.vo';
import { FamilyResponsibilityVO } from './family-responsibility.vo';
import { FamilyRoleVO } from './family-role.vo';

export class FamilyMemberVO {
  private readonly _userId: UserId;
  private readonly _role: FamilyRoleVO;
  private readonly _responsibility: FamilyResponsibilityVO;
  private readonly _joinedAt: Date;

  constructor(
    userId: UserId,
    role: FamilyRoleVO,
    responsibility: FamilyResponsibilityVO,
    joinedAt?: Date,
  ) {
    this._userId = userId;
    this._role = role;
    this._responsibility = responsibility;
    this._joinedAt = joinedAt || new Date();
  }

  get userId(): UserId {
    return this._userId;
  }

  get role(): FamilyRoleVO {
    return this._role;
  }

  get responsibility(): FamilyResponsibilityVO {
    return this._responsibility;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }

  isResponsible(): boolean {
    return this._responsibility.isResponsible();
  }

  isPrincipalResponsible(): boolean {
    return this._responsibility.isPrincipalResponsible();
  }

  isAuxiliaryResponsible(): boolean {
    return this._responsibility.isAuxiliaryResponsible();
  }

  canCreateTasksFor(member: FamilyMemberVO): boolean {
    return this._responsibility.canCreateTasksFor(member._responsibility);
  }

  canManageFamily(): boolean {
    return this.isResponsible();
  }

  canRemoveMember(memberToRemove: FamilyMemberVO): boolean {
    if (this.isPrincipalResponsible()) {
      return true;
    }
    if (this.isAuxiliaryResponsible()) {
      return !memberToRemove.isPrincipalResponsible();
    }
    return false;
  }

  equals(other: FamilyMemberVO): boolean {
    return this._userId.equals(other._userId);
  }
}
