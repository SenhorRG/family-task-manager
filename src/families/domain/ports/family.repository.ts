import { UserId } from '../../../users/domain/value-objects';
import { Family } from '../aggregates';
import { FamilyId } from '../value-objects';

export interface FamilyRepository {
  save(family: Family): Promise<void>;
  findById(id: FamilyId): Promise<Family | null>;
  findByPrincipalResponsible(userId: UserId): Promise<Family | null>;
  findByMember(userId: UserId): Promise<Family[]>;
  delete(id: FamilyId): Promise<void>;
}
