import { PasswordHasher } from '../../../shared';

export class Password {
  private readonly _hashedValue: string;

  constructor(password: string, passwordHasher: PasswordHasher, isHashed: boolean = false) {
    if (isHashed) {
      this._hashedValue = password;
    } else {
      this.validatePassword(password);
      this._hashedValue = passwordHasher.hash(password);
    }
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  private validatePassword(password: string): void {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  comparePassword(plainPassword: string, passwordHasher: PasswordHasher): boolean {
    return passwordHasher.compare(plainPassword, this._hashedValue);
  }

  equals(other: Password): boolean {
    return this._hashedValue === other._hashedValue;
  }
}
