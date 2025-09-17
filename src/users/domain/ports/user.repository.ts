import { User } from '../aggregates';
import { Email, UserId } from '../value-objects';

export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  exists(email: Email): Promise<boolean>;
  delete(id: UserId): Promise<void>;
}
