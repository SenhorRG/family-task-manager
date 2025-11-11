import { UserId } from '../../domain';
import { UserReadDto } from '../dtos';

export interface UserReadRepository {
  findById(id: UserId): Promise<UserReadDto | null>;
  findByEmail(email: string): Promise<UserReadDto | null>;
  findAll(): Promise<UserReadDto[]>;
}
