import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangeTaskStatusCommand } from './change-task-status.command';
import { TaskRepository } from '../../../domain/ports';
import { TaskId, TaskStatusVO } from '../../../domain/value-objects';
import { UserId } from '../../../../users/domain/value-objects';
import { NotFoundException, ForbiddenException, Inject } from '@nestjs/common';

@CommandHandler(ChangeTaskStatusCommand)
export class ChangeTaskStatusHandler implements ICommandHandler<ChangeTaskStatusCommand> {
  constructor(@Inject('TaskRepository') private readonly taskRepository: TaskRepository) {}

  async execute(command: ChangeTaskStatusCommand): Promise<void> {
    const { taskId, newStatus, changedBy } = command;

    const taskIdVO = new TaskId(taskId);
    const changedByVO = new UserId(changedBy);

    const task = await this.taskRepository.findById(taskIdVO);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.canBeManagedBy(changedByVO)) {
      throw new ForbiddenException(
        'User does not have permission to change the status of this task',
      );
    }

    task.changeStatus(new TaskStatusVO(newStatus), changedByVO);

    await this.taskRepository.save(task);
  }
}
