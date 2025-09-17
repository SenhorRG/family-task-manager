import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterUserCommand } from './register-user.command';
import { Email, UserFactory, UserRepository } from '../../../domain';
import { ConflictException, Inject } from '@nestjs/common';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userFactory: UserFactory,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const { fullName, email, password } = command;

    const userEmail = new Email(email);

    const userExists = await this.userRepository.exists(userEmail);
    if (userExists) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = this.userFactory.createUser(fullName, email, password);
    await this.userRepository.save(user);
  }
}
