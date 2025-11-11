import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/infrastructure/auth';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateFamilyCommand,
  AddMemberCommand,
  RemoveMemberCommand,
  ChangeMemberRoleCommand,
} from '../../application/commands';
import { GetFamilyByIdQuery, GetFamiliesByUserQuery } from '../../application/queries';
import { CreateFamilyRequestDto, AddMemberRequestDto, ChangeMemberRoleRequestDto } from './dto';
import { FamilyReadDto } from '../../application/dtos';
import { AuthenticatedRequest } from '../../../shared';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createFamily(
    @Body() createFamilyDto: CreateFamilyRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const { name, role } = createFamilyDto;
    const principalResponsibleUserId = req.user.sub;

    await this.commandBus.execute(new CreateFamilyCommand(name, principalResponsibleUserId, role));

    return { message: 'Family created successfully' };
  }

  @Post('members')
  async addMember(
    @Body() addMemberDto: AddMemberRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const { familyId, userId, role, responsibility } = addMemberDto;
    const addedBy = req.user.sub;

    await this.commandBus.execute(
      new AddMemberCommand(familyId, userId, role, responsibility, addedBy),
    );

    return { message: 'Member added successfully' };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') familyId: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const removedBy = req.user.sub;

    await this.commandBus.execute(new RemoveMemberCommand(familyId, userId, removedBy));

    return { message: 'Member removed successfully' };
  }

  @Put('members/role')
  async changeMemberRole(
    @Body() changeRoleDto: ChangeMemberRoleRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const { familyId, userId, newRole, newResponsibility } = changeRoleDto;
    const changedBy = req.user.sub;

    await this.commandBus.execute(
      new ChangeMemberRoleCommand(familyId, userId, newRole, newResponsibility, changedBy),
    );

    return { message: 'Role changed successfully' };
  }

  @Get(':id')
  async getFamilyById(@Param('id') id: string): Promise<FamilyReadDto> {
    return this.queryBus.execute<GetFamilyByIdQuery, FamilyReadDto>(new GetFamilyByIdQuery(id));
  }

  @Get('user/:userId')
  async getFamiliesByUser(@Param('userId') userId: string): Promise<FamilyReadDto[]> {
    return this.queryBus.execute<GetFamiliesByUserQuery, FamilyReadDto[]>(
      new GetFamiliesByUserQuery(userId),
    );
  }
}
