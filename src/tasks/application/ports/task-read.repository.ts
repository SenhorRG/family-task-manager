import { TaskId } from '../../domain/value-objects';
import { FamilyId } from '../../../families/domain/value-objects';
import { UserId } from '../../../users/domain/value-objects';
import { TaskReadDto } from '../dtos';

export interface TaskReadRepository {
  findById(id: TaskId): Promise<TaskReadDto | null>;
  findByFamily(familyId: FamilyId): Promise<TaskReadDto[]>;
  findByAssignedTo(userId: UserId): Promise<TaskReadDto[]>;
  findByCreatedBy(userId: UserId): Promise<TaskReadDto[]>;
  findAll(): Promise<TaskReadDto[]>;
}
