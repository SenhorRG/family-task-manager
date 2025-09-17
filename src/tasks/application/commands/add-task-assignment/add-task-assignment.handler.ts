import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AddTaskAssignmentCommand } from './add-task-assignment.command';
import { TaskRepository } from '../../../domain/ports';
import { FamilyRepository } from '../../../../families/domain/ports';
import { TaskId } from '../../../domain/value-objects';
import { UserId } from '../../../../users/domain/value-objects';
import { NotFoundException, ForbiddenException, Inject } from '@nestjs/common';

@CommandHandler(AddTaskAssignmentCommand)
export class AddTaskAssignmentHandler implements ICommandHandler<AddTaskAssignmentCommand> {
  constructor(
    @Inject('TaskRepository')
    private readonly taskRepository: TaskRepository,
    @Inject('FamilyRepository')
    private readonly familyRepository: FamilyRepository,
  ) {}

  async execute(command: AddTaskAssignmentCommand): Promise<void> {
    const { taskId, assignedTo, assignedBy } = command;

    const taskIdVO = new TaskId(taskId);
    const assignedToVO = new UserId(assignedTo);
    const assignedByVO = new UserId(assignedBy);

    const task = await this.taskRepository.findById(taskIdVO);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const family = await this.familyRepository.findById(task.familyId);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (!family.isMember(assignedByVO)) {
      throw new ForbiddenException('User is not a member of this family');
    }

    if (!family.isMember(assignedToVO)) {
      throw new ForbiddenException('User to be assigned is not a member of this family');
    }

    if (!family.canCreateTaskFor(assignedByVO, assignedToVO)) {
      throw new ForbiddenException('User cannot assign tasks to this member');
    }

    task.addAssignment(assignedToVO, assignedByVO);

    await this.taskRepository.save(task);
  }
}
