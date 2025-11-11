import { BaseAggregate, BaseEvent, PasswordHasher } from '../../../shared';
import { Password, FullName, Email, UserId } from '../value-objects';
import { UserCreatedEvent, UserLoggedInEvent, UserDeletedEvent } from '../events';

export class User extends BaseAggregate {
  private _fullName: FullName;
  private _email: Email;
  private _password: Password;

  constructor(
    id: UserId,
    fullName: FullName,
    email: Email,
    password: Password,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id.value);
    this._fullName = fullName;
    this._email = email;
    this._password = password;

    if (createdAt) {
      this._createdAt = createdAt;
    }
    if (updatedAt) {
      this._updatedAt = updatedAt;
    }

    if (!createdAt) {
      this.addEvent(
        new UserCreatedEvent(this._id, {
          fullName: this._fullName.value,
          email: this._email.value,
          createdAt: this._createdAt,
        }),
      );
    }
  }

  get fullName(): FullName {
    return this._fullName;
  }

  get email(): Email {
    return this._email;
  }

  get password(): Password {
    return this._password;
  }

  get userId(): UserId {
    return new UserId(this._id);
  }

  login(plainPassword: string, passwordHasher: PasswordHasher): boolean {
    const isValid = this._password.comparePassword(plainPassword, passwordHasher);

    if (isValid) {
      this.addEvent(
        new UserLoggedInEvent(this._id, {
          fullName: this._fullName.value,
          email: this._email.value,
          loggedInAt: new Date(),
        }),
      );
    }

    return isValid;
  }

  changePassword(newPassword: string, passwordHasher: PasswordHasher): void {
    this._password = new Password(newPassword, passwordHasher);
    this.updateTimestamp();
  }

  delete(): void {
    this.addEvent(
      new UserDeletedEvent(
        this._id,
        {
          fullName: this._fullName.value,
          email: this._email.value,
          deletedAt: new Date(),
        },
        this.version + 1,
      ),
    );
  }

  protected applyEvent(event: BaseEvent): void {
    void event;
    this.updateTimestamp();
  }
}
