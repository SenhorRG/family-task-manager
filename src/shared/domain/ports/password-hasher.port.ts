export interface PasswordHasher {
  hash(password: string): string;
  compare(plainPassword: string, hashedPassword: string): boolean;
}
