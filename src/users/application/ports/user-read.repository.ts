import { UserId } from '../../domain';

export interface UserReadRepository {
  findById(id: UserId): Promise<any>;
  findByEmail(email: string): Promise<any>;
  findAll(): Promise<any[]>;
}
