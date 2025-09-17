import { FamilyId } from '../../domain/value-objects';
import { UserId } from '../../../users/domain/value-objects';

export interface FamilyReadRepository {
  findById(id: FamilyId): Promise<any>;
  findByMember(userId: UserId): Promise<any[]>;
  findAll(): Promise<any[]>;
}
