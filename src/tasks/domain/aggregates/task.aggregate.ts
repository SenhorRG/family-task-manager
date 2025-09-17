import { BaseAggregate, BaseEvent } from '../../../shared/domain/value-objects';
import {
  TaskId,
  TaskLocationVO,
  TaskStatusVO,
  TaskAssignmentVO,
  TaskTitleVO,
  TaskDescriptionVO,
} from '../value-objects';
import { FamilyId } from '../../../families/domain/value-objects';
import { UserId } from '../../../users/domain/value-objects';
import {
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskStatusChangedEvent,
  TaskAssignmentAddedEvent,
  TaskAssignmentRemovedEvent,
} from '../events';

export class Task extends BaseAggregate {
  private _title: TaskTitleVO;
  private _description: TaskDescriptionVO;
  private _familyId: FamilyId;
  private _assignments: TaskAssignmentVO[] = [];
  private _createdBy: UserId;
  private _status: TaskStatusVO;
  private _dueDate?: Date;
  private _location: TaskLocationVO;

  constructor(
    id: TaskId,
    title: TaskTitleVO,
    description: TaskDescriptionVO,
    familyId: FamilyId,
    assignments: TaskAssignmentVO[],
    createdBy: UserId,
    status: TaskStatusVO,
    dueDate?: Date,
    location?: TaskLocationVO,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id.value);
    this._title = title;
    this._description = description;
    this._familyId = familyId;
    this._assignments = assignments;
    this._createdBy = createdBy;
    this._status = status;
    this._dueDate = dueDate;
    this._location = location || new TaskLocationVO('');

    if (createdAt) {
      this._createdAt = createdAt;
    }
    if (updatedAt) {
      this._updatedAt = updatedAt;
    }

    if (!createdAt) {
      this.addEvent(
        new TaskCreatedEvent(this._id, {
          title: this._title.value,
          description: this._description.value,
          familyId: this._familyId.value,
          assignedTo: this._assignments.map((a) => a.assignedTo.value),
          assignedBy: this._createdBy.value,
          dueDate: this._dueDate,
          location: this._location.hasLocation() ? this._location.value : undefined,
          createdAt: this._createdAt,
        }),
      );
    }
  }

  get taskId(): TaskId {
    return new TaskId(this._id);
  }

  get title(): TaskTitleVO {
    return this._title;
  }

  get description(): TaskDescriptionVO {
    return this._description;
  }

  get familyId(): FamilyId {
    return this._familyId;
  }

  get assignments(): TaskAssignmentVO[] {
    return [...this._assignments];
  }

  get createdBy(): UserId {
    return this._createdBy;
  }

  get status(): TaskStatusVO {
    return this._status;
  }

  get dueDate(): Date | undefined {
    return this._dueDate;
  }

  get location(): TaskLocationVO {
    return this._location;
  }

  getAssignedUsers(): UserId[] {
    return this._assignments.map((assignment) => assignment.assignedTo);
  }

  isAssignedTo(userId: UserId): boolean {
    return this._assignments.some((assignment) => assignment.assignedTo.equals(userId));
  }

  updateDetails(
    title?: string,
    description?: string,
    dueDate?: Date,
    location?: string,
    updatedBy?: UserId,
  ): void {
    let hasChanges = false;
    const changes: any = {};

    if (title && title !== this._title.value) {
      this._title = new TaskTitleVO(title);
      changes.title = title;
      hasChanges = true;
    }

    if (description && description !== this._description.value) {
      this._description = new TaskDescriptionVO(description);
      changes.description = description;
      hasChanges = true;
    }

    if (dueDate !== undefined && dueDate !== this._dueDate) {
      this._dueDate = dueDate;
      changes.dueDate = dueDate;
      hasChanges = true;
    }

    if (location !== undefined && location !== this._location.value) {
      this._location = new TaskLocationVO(location);
      changes.location = location;
      hasChanges = true;
    }

    if (hasChanges) {
      this.addEvent(
        new TaskUpdatedEvent(this._id, {
          ...changes,
          updatedBy: updatedBy?.value || this._createdBy.value,
          updatedAt: new Date(),
        }),
      );
    }
  }

  changeStatus(newStatus: TaskStatusVO, changedBy: UserId): void {
    if (!this._status.canTransitionTo(newStatus.value)) {
      throw new Error(
        `It is not possible to change the status of ${this._status.value} to ${newStatus.value}`,
      );
    }

    const oldStatus = this._status.value;
    this._status = new TaskStatusVO(newStatus.value);

    this.addEvent(
      new TaskStatusChangedEvent(this._id, {
        oldStatus,
        newStatus: newStatus.value,
        changedBy: changedBy.value,
        changedAt: new Date(),
      }),
    );
  }

  addAssignment(assignedTo: UserId, assignedBy: UserId): void {
    if (this.isAssignedTo(assignedTo)) {
      throw new Error('User is already assigned to this task');
    }

    const assignment = new TaskAssignmentVO(assignedTo, assignedBy);
    this._assignments.push(assignment);

    this.addEvent(
      new TaskAssignmentAddedEvent(this._id, {
        assignedTo: assignedTo.value,
        assignedBy: assignedBy.value,
        assignedAt: new Date(),
      }),
    );
  }

  removeAssignment(assignedTo: UserId, removedBy: UserId): void {
    const assignmentIndex = this._assignments.findIndex((assignment) =>
      assignment.assignedTo.equals(assignedTo),
    );

    if (assignmentIndex === -1) {
      throw new Error('User is not assigned to this task');
    }

    this._assignments.splice(assignmentIndex, 1);

    this.addEvent(
      new TaskAssignmentRemovedEvent(this._id, {
        assignedTo: assignedTo.value,
        removedBy: removedBy.value,
        removedAt: new Date(),
      }),
    );
  }

  canBeManagedBy(userId: UserId): boolean {
    if (this._createdBy.equals(userId)) {
      return true;
    }

    return this.isAssignedTo(userId);
  }

  canBeEditedBy(userId: UserId): boolean {
    return this._createdBy.equals(userId);
  }

  protected applyEvent(event: BaseEvent): void {
    this.updateTimestamp();
  }
}
