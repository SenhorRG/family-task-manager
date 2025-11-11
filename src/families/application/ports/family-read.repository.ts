import { FamilyId } from '../../domain/value-objects';
import { UserId } from '../../../users/domain/value-objects';
import { FamilyReadDto } from '../dtos';

export interface FamilyReadRepository {
  findById(id: FamilyId): Promise<FamilyReadDto | null>;
  findByMember(userId: UserId): Promise<FamilyReadDto[]>;
  findAll(): Promise<FamilyReadDto[]>;
}
