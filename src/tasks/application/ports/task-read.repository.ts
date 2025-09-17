import { TaskId } from '../../domain/value-objects';
import { FamilyId } from '../../../families/domain/value-objects';
import { UserId } from '../../../users/domain/value-objects';

export interface TaskReadRepository {
  findById(id: TaskId): Promise<any>;
  findByFamily(familyId: FamilyId): Promise<any[]>;
  findByAssignedTo(userId: UserId): Promise<any[]>;
  findByCreatedBy(userId: UserId): Promise<any[]>;
  findAll(): Promise<any[]>;
}
