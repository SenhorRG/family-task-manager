import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateTaskCommand } from './update-task.command';
import { TaskRepository } from '../../../domain/ports';
import { TaskId } from '../../../domain/value-objects';
import { UserId } from '../../../../users/domain/value-objects';
import { NotFoundException, ForbiddenException, Inject } from '@nestjs/common';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(@Inject('TaskRepository') private readonly taskRepository: TaskRepository) {}

  async execute(command: UpdateTaskCommand): Promise<void> {
    const { taskId, title, description, dueDate, location, updatedBy } = command;

    const taskIdVO = new TaskId(taskId);
    const updatedByVO = new UserId(updatedBy);

    const task = await this.taskRepository.findById(taskIdVO);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (!task.canBeEditedBy(updatedByVO)) {
      throw new ForbiddenException('User does not have permission to edit this task');
    }

    task.updateDetails(title, description, dueDate, location, updatedByVO);

    await this.taskRepository.save(task);
  }
}
