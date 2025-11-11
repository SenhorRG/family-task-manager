import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserCommand, LoginUserCommand } from '../../application/commands';
import { GetUserByIdQuery } from '../../application/queries';
import { RegisterUserRequestDto, LoginUserRequestDto, AuthResponseDto } from './dto';
import { UserReadDto } from '../../application/dtos';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() registerUserDto: RegisterUserRequestDto): Promise<{ message: string }> {
    const { fullName, email, password } = registerUserDto;

    await this.commandBus.execute(new RegisterUserCommand(fullName, email, password));

    return { message: 'Usuário registrado com sucesso' };
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserRequestDto): Promise<AuthResponseDto> {
    const { email, password } = loginUserDto;

    const result = await this.commandBus.execute(new LoginUserCommand(email, password));

    const payload = { sub: result.userId, email: result.email };
    const accessToken = this.jwtService.sign(payload);

    return new AuthResponseDto(accessToken, {
      id: result.userId,
      email: result.email,
    });
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserReadDto> {
    return this.queryBus.execute<GetUserByIdQuery, UserReadDto>(new GetUserByIdQuery(id));
  }
}
