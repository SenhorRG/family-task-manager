import { Injectable, Inject } from '@nestjs/common';
import { User } from '../aggregates';
import { UserId, Email, Password, FullName } from '../value-objects';
import { IdGenerator, PasswordHasher, BaseEvent, EventPayload } from '../../../shared';
import { UserCreatedEvent, UserCreatedEventData } from '../events';

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

  reconstructUserFromEvents(
    aggregateId: string,
    events: BaseEvent[],
    hashedPassword: string,
  ): User {
    if (events.length === 0) {
      throw new Error(`No events found for user ${aggregateId}`);
    }

    const firstEvent = events[0];
    const isUserCreatedEvent =
      firstEvent instanceof UserCreatedEvent ||
      (firstEvent.eventType === 'UserCreatedEvent' && firstEvent.aggregateType === 'User');

    if (!isUserCreatedEvent) {
      throw new Error(
        `First event must be UserCreatedEvent, but got ${firstEvent.eventType} (aggregateType: ${firstEvent.aggregateType})`,
      );
    }

    const userId = new UserId(aggregateId);
    const userCreatedData = this.normalizeUserCreatedData(firstEvent);

    const userFullName = new FullName(userCreatedData.fullName);
    const userEmail = new Email(userCreatedData.email);
    const userPassword = new Password(hashedPassword, this.passwordHasher, true);

    const user = new User(
      userId,
      userFullName,
      userEmail,
      userPassword,
      userCreatedData.createdAt,
      firstEvent.occurredOn,
    );

    const remainingEvents = events.slice(1);
    if (remainingEvents.length > 0) {
      user.loadFromHistory(remainingEvents);
    }

    return user;
  }

  private normalizeUserCreatedData(event: BaseEvent): UserCreatedEventData {
    if (event instanceof UserCreatedEvent) {
      return event.eventData;
    }

    const payload = event.eventData;
    const fullName = payload.fullName;
    const email = payload.email;
    const createdAtRaw = payload.createdAt;

    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      throw new Error('UserCreatedEvent payload is missing a valid fullName');
    }

    if (typeof email !== 'string' || email.trim().length === 0) {
      throw new Error('UserCreatedEvent payload is missing a valid email');
    }

    const createdAt =
      createdAtRaw instanceof Date
        ? createdAtRaw
        : typeof createdAtRaw === 'string' || typeof createdAtRaw === 'number'
          ? new Date(createdAtRaw)
          : null;

    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      throw new Error('UserCreatedEvent payload is missing a valid createdAt');
    }

    return {
      fullName,
      email,
      createdAt,
    };
  }
}
