import { Injectable, Inject } from '@nestjs/common';
import { User } from '../aggregates';
import { UserId, Email, Password, FullName } from '../value-objects';
import { IdGenerator, PasswordHasher } from '../../../shared';

@Injectable()
export class UserFactory {
  constructor(
    @Inject('IdGenerator') private readonly idGenerator: IdGenerator,
    @Inject('PasswordHasher') private readonly passwordHasher: PasswordHasher,
  ) {}

  createUser(fullName: string, email: string, password: string): User {
    const userId = new UserId(this.idGenerator.generate());
    const userFullName = new FullName(fullName);
    const userEmail = new Email(email);
    const userPassword = new Password(password, this.passwordHasher);

    return new User(userId, userFullName, userEmail, userPassword);
  }

  createUserFromPersistence(
    id: string,
    fullName: string,
    email: string,
    hashedPassword: string,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    const userId = new UserId(id);
    const userFullName = new FullName(fullName);
    const userEmail = new Email(email);
    const userPassword = new Password(hashedPassword, this.passwordHasher, true);

    return new User(userId, userFullName, userEmail, userPassword, createdAt, updatedAt);
  }
}
