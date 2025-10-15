import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserId } from '../../../../users/domain/value-objects';
import { FamilyId, FamilyResponsibilityVO, FamilyRoleVO } from '../../../domain/value-objects';
import { AddMemberCommand } from './add-member.command';
import { FamilyRepository } from '../../../domain/ports';
import { Inject, NotFoundException } from '@nestjs/common';

@CommandHandler(AddMemberCommand)
export class AddMemberHandler implements ICommandHandler<AddMemberCommand> {
  constructor(
    @Inject('FamilyRepository')
    private readonly familyRepository: FamilyRepository,
  ) {}

  async execute(command: AddMemberCommand): Promise<void> {
    const { familyId, userId, role, responsibility, addedBy } = command;

    const familyIdVO = new FamilyId(familyId);
    const userIdVO = new UserId(userId);
    const addedByVO = new UserId(addedBy);
    const roleVO = new FamilyRoleVO(role);
    const responsibilityVO = new FamilyResponsibilityVO(responsibility);

    const family = await this.familyRepository.findById(familyIdVO);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    family.addMember(userIdVO, roleVO, responsibilityVO, addedByVO);

    await this.familyRepository.save(family);
  }
}
