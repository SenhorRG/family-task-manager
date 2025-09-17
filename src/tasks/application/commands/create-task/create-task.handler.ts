import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateTaskCommand } from './create-task.command';
import { TaskFactory } from '../../../domain/services';
import { TaskRepository } from '../../../domain/ports';
import { FamilyRepository } from '../../../../families/domain/ports';
import { FamilyId } from '../../../../families/domain/value-objects';
import { UserId } from '../../../../users/domain/value-objects';
import { NotFoundException, ForbiddenException, Inject } from '@nestjs/common';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(
    private readonly taskFactory: TaskFactory,
    @Inject('TaskRepository')
    private readonly taskRepository: TaskRepository,
    @Inject('FamilyRepository')
    private readonly familyRepository: FamilyRepository,
  ) {}

  async execute(command: CreateTaskCommand): Promise<void> {
    const { title, description, familyId, assignedTo, createdBy, dueDate, location } = command;

    const familyIdVO = new FamilyId(familyId);
    const createdByVO = new UserId(createdBy);

    const family = await this.familyRepository.findById(familyIdVO);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (!family.isMember(createdByVO)) {
      throw new ForbiddenException('User is not a member of this family');
    }

    for (const userId of assignedTo) {
      const targetUserId = new UserId(userId);
      if (!family.canCreateTaskFor(createdByVO, targetUserId)) {
        throw new ForbiddenException(`User cannot create tasks for ${userId}`);
      }
    }

    const task = this.taskFactory.createTask(
      title,
      description,
      familyId,
      assignedTo,
      createdBy,
      dueDate,
      location,
    );

    await this.taskRepository.save(task);
  }
}
