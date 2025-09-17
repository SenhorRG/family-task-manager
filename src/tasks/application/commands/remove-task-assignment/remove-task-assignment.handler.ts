import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveTaskAssignmentCommand } from './remove-task-assignment.command';
import { TaskRepository } from '../../../domain/ports';
import { TaskId } from '../../../domain/value-objects';
import { UserId } from '../../../../users/domain/value-objects';
import { NotFoundException, ForbiddenException, Inject } from '@nestjs/common';

@CommandHandler(RemoveTaskAssignmentCommand)
export class RemoveTaskAssignmentHandler implements ICommandHandler<RemoveTaskAssignmentCommand> {
  constructor(@Inject('TaskRepository') private readonly taskRepository: TaskRepository) {}

  async execute(command: RemoveTaskAssignmentCommand): Promise<void> {
    const { taskId, assignedTo, removedBy } = command;

    const taskIdVO = new TaskId(taskId);
    const assignedToVO = new UserId(assignedTo);
    const removedByVO = new UserId(removedBy);

    const task = await this.taskRepository.findById(taskIdVO);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.canBeManagedBy(removedByVO)) {
      throw new ForbiddenException(
        'User does not have permission to remove assignments from this task',
      );
    }

    task.removeAssignment(assignedToVO, removedByVO);

    await this.taskRepository.save(task);
  }
}
