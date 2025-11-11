import { UserId } from '../../../users/domain/value-objects/user-id.vo';
import { BaseAggregate, BaseEvent } from '../../../shared';
import {
  FamilyId,
  FamilyMemberVO,
  FamilyNameVO,
  FamilyRoleVO,
  FamilyResponsibilityVO,
} from '../value-objects';
import {
  FamilyCreatedEvent,
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberRoleChangedEvent,
  FamilyDeletedEvent,
} from '../events';

export class Family extends BaseAggregate {
  private _name: FamilyNameVO;
  private _members: FamilyMemberVO[] = [];
  private _principalResponsible: FamilyMemberVO;

  constructor(
    id: FamilyId,
    name: FamilyNameVO,
    principalResponsible: FamilyMemberVO,
    members?: FamilyMemberVO[],
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id.value);
    this._name = name;
    this._principalResponsible = principalResponsible;

    if (members) {
      this._members = members;
    } else {
      this._members = [principalResponsible];
    }

    if (createdAt) {
      this._createdAt = createdAt;
    }

    if (updatedAt) {
      this._updatedAt = updatedAt;
    }

    if (!createdAt) {
      this.addEvent(
        new FamilyCreatedEvent(this.id, {
          name: this._name.value,
          principalResponsibleUserId: this._principalResponsible.userId.value,
          principalRole: this._principalResponsible.role.value,
          createdAt: this._createdAt,
        }),
      );
    }
  }

  get familyId(): FamilyId {
    return new FamilyId(this.id);
  }

  get name(): FamilyNameVO {
    return this._name;
  }

  get members(): FamilyMemberVO[] {
    return [...this._members];
  }

  get principalResponsible(): FamilyMemberVO {
    return this._principalResponsible;
  }

  getResponsibleMembers(): FamilyMemberVO[] {
    return this._members.filter((member) => member.isResponsible());
  }

  getAuxiliaryResponsibleMembers(): FamilyMemberVO[] {
    return this._members.filter((member) => member.isAuxiliaryResponsible());
  }

  addMember(
    userId: UserId,
    role: FamilyRoleVO,
    responsibility: FamilyResponsibilityVO,
    addedBy: UserId,
  ): void {
    const addingMember = this.getMember(addedBy);
    if (!addingMember || !addingMember.canManageFamily()) {
      throw new Error('User does not have permission to add members to the family');
    }

    if (this.isMember(userId)) {
      throw new Error('User is already a member of the family');
    }

    if (responsibility.isAuxiliaryResponsible()) {
      const auxiliaryResponsibleMembers = this.getAuxiliaryResponsibleMembers();
      if (auxiliaryResponsibleMembers.length >= 2) {
        throw new Error('Maximum number of auxiliary responsible members reached');
      }
    }

    const newMember = new FamilyMemberVO(userId, role, responsibility);
    this._members.push(newMember);

    this.addEvent(
      new MemberAddedEvent(this._id, {
        userId: userId.value,
        role: role.value,
        responsibility: responsibility.value,
        addedBy: addedBy.value,
        addedAt: new Date(),
      }),
    );
  }

  removeMember(userId: UserId, removedBy: UserId): void {
    const removingMember = this.getMember(removedBy);
    if (!removingMember || !removingMember.canManageFamily()) {
      throw new Error('User does not have permission to remove members from the family');
    }

    const memberToRemove = this.getMember(userId);
    if (!memberToRemove) {
      throw new Error('Member not found in the family');
    }

    if (!removingMember.canRemoveMember(memberToRemove)) {
      throw new Error('User does not have permission to remove this member');
    }

    this._members = this._members.filter((member) => !member.userId.equals(userId));

    this.addEvent(
      new MemberRemovedEvent(this._id, {
        userId: userId.value,
        removedBy: removedBy.value,
        removedAt: new Date(),
      }),
    );
  }

  changeMemberRole(
    userId: UserId,
    newRole: FamilyRoleVO,
    newResponsibility: FamilyResponsibilityVO,
    changedBy: UserId,
  ): void {
    const changingMember = this.getMember(changedBy);
    if (!changingMember || !changingMember.canManageFamily()) {
      throw new Error('User does not have permission to change roles');
    }

    const memberToChange = this.getMember(userId);
    if (!memberToChange) {
      throw new Error('Member not found in the family');
    }

    if (!changingMember.canRemoveMember(memberToChange)) {
      throw new Error("User does not have permission to change this member's role");
    }

    if (newResponsibility.isAuxiliaryResponsible()) {
      const auxiliaryResponsibles = this.getAuxiliaryResponsibleMembers();
      if (auxiliaryResponsibles.length >= 2 && !memberToChange.isAuxiliaryResponsible()) {
        throw new Error('Family already has the maximum of 2 auxiliary responsible members');
      }
    }

    const oldRole = memberToChange.role;
    const oldResponsibility = memberToChange.responsibility;
    const memberIndex = this._members.findIndex((member) => member.userId.equals(userId));

    if (memberIndex !== -1) {
      this._members[memberIndex] = new FamilyMemberVO(
        userId,
        newRole,
        newResponsibility,
        memberToChange.joinedAt,
      );
    }

    this.addEvent(
      new MemberRoleChangedEvent(this._id, {
        userId: userId.value,
        oldRole: oldRole.value,
        oldResponsibility: oldResponsibility.value,
        newRole: newRole.value,
        newResponsibility: newResponsibility.value,
        changedBy: changedBy.value,
        changedAt: new Date(),
      }),
    );
  }

  isMember(userId: UserId): boolean {
    return this._members.some((member) => member.userId.equals(userId));
  }

  getMember(userId: UserId): FamilyMemberVO | null {
    return this._members.find((member) => member.userId.equals(userId)) || null;
  }

  canCreateTaskFor(creatorUserId: UserId, targetUserId: UserId): boolean {
    const creator = this.getMember(creatorUserId);
    const target = this.getMember(targetUserId);

    if (!creator || !target) {
      return false;
    }

    return creator.canCreateTasksFor(target);
  }

  delete(): void {
    this.addEvent(
      new FamilyDeletedEvent(
        this._id,
        {
          name: this._name.value,
          deletedAt: new Date(),
        },
        this.version + 1,
      ),
    );
  }

  protected applyEvent(event: BaseEvent): void {
    void event;
    this.updateTimestamp();
  }
}
