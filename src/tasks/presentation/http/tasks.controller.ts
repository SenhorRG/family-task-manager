import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/infrastructure/auth';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateTaskCommand,
  UpdateTaskCommand,
  ChangeTaskStatusCommand,
  AddTaskAssignmentCommand,
  RemoveTaskAssignmentCommand,
} from '../../application/commands';
import {
  GetTaskByIdQuery,
  GetTasksByFamilyQuery,
  GetTasksByUserQuery,
} from '../../application/queries';
import {
  CreateTaskRequestDto,
  UpdateTaskRequestDto,
  ChangeTaskStatusRequestDto,
  AddTaskAssignmentRequestDto,
} from './dto';
import { TaskReadDto } from '../../application/dtos';
import { AuthenticatedRequest } from '../../../shared';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createTask(
    @Body() createTaskDto: CreateTaskRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const { title, description, familyId, assignedTo, dueDate, location } = createTaskDto;
    const createdBy = req.user.sub;

    const dueDateObj = dueDate ? new Date(dueDate) : undefined;

    await this.commandBus.execute(
      new CreateTaskCommand(
        title,
        description,
        familyId,
        assignedTo,
        createdBy,
        dueDateObj,
        location,
      ),
    );

    return { message: 'Task created successfully' };
  }

  @Put(':id')
  async updateTask(
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const { title, description, dueDate, location } = updateTaskDto;
    const updatedBy = req.user.sub;

    const dueDateObj = dueDate ? new Date(dueDate) : undefined;

    await this.commandBus.execute(
      new UpdateTaskCommand(taskId, updatedBy, title, description, dueDateObj, location),
    );

    return { message: 'Task updated successfully' };
  }

  @Put(':id/status')
  async changeTaskStatus(
    @Param('id') taskId: string,
    @Body() changeStatusDto: ChangeTaskStatusRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const { status } = changeStatusDto;
    const changedBy = req.user.sub;

    await this.commandBus.execute(new ChangeTaskStatusCommand(taskId, status, changedBy));

    return { message: 'Task status changed successfully' };
  }

  @Post(':id/assignments')
  async addTaskAssignment(
    @Param('id') taskId: string,
    @Body() addAssignmentDto: AddTaskAssignmentRequestDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const { userId } = addAssignmentDto;
    const assignedBy = req.user.sub;

    await this.commandBus.execute(new AddTaskAssignmentCommand(taskId, userId, assignedBy));

    return { message: 'Assignment added successfully' };
  }

  @Delete(':id/assignments/:userId')
  async removeTaskAssignment(
    @Param('id') taskId: string,
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const removedBy = req.user.sub;

    await this.commandBus.execute(new RemoveTaskAssignmentCommand(taskId, userId, removedBy));

    return { message: 'Assignment removed successfully' };
  }

  @Get(':id')
  async getTaskById(@Param('id') id: string): Promise<TaskReadDto> {
    return this.queryBus.execute<GetTaskByIdQuery, TaskReadDto>(new GetTaskByIdQuery(id));
  }

  @Get('family/:familyId')
  async getTasksByFamily(@Param('familyId') familyId: string): Promise<TaskReadDto[]> {
    return this.queryBus.execute<GetTasksByFamilyQuery, TaskReadDto[]>(
      new GetTasksByFamilyQuery(familyId),
    );
  }

  @Get('user/:userId')
  async getTasksByUser(@Param('userId') userId: string): Promise<TaskReadDto[]> {
    return this.queryBus.execute<GetTasksByUserQuery, TaskReadDto[]>(
      new GetTasksByUserQuery(userId),
    );
  }
}
