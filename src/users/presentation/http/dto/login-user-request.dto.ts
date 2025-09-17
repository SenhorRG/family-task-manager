import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginUserRequestDto {
  @IsEmail({}, { message: 'Email must be a valid email' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
