import { Task } from '../aggregates/task.aggregate';
import { TaskId } from '../value-objects';
import { FamilyId } from '../../../families/domain/value-objects';
import { UserId } from '../../../users/domain/value-objects';

export interface TaskRepository {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | null>;
  findByFamily(familyId: FamilyId): Promise<Task[]>;
  findByAssignedTo(userId: UserId): Promise<Task[]>;
  findByCreatedBy(userId: UserId): Promise<Task[]>;
  delete(id: TaskId): Promise<void>;
}
