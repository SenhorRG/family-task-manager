import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginUserCommand } from './login-user.command';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { Email, UserRepository } from '../../../domain';
import { PasswordHasher } from '../../../../shared';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('PasswordHasher')
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(command: LoginUserCommand): Promise<{ userId: string; email: string }> {
    const { email, password } = command;

    const userEmail = new Email(email);

    const user = await this.userRepository.findByEmail(userEmail);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidLogin = user.login(password, this.passwordHasher);
    if (!isValidLogin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.userRepository.save(user);

    return { userId: user.userId.value, email: user.email.value };
  }
}
