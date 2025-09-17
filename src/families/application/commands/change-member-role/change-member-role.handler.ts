import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangeMemberRoleCommand } from './change-member-role.command';
import { FamilyRepository } from '../../../domain/ports';
import { UserId } from '../../../../users/domain/value-objects';
import { FamilyRoleVO, FamilyResponsibilityVO, FamilyId } from '../../../domain/value-objects';
import { NotFoundException, Inject } from '@nestjs/common';

@CommandHandler(ChangeMemberRoleCommand)
export class ChangeMemberRoleHandler implements ICommandHandler<ChangeMemberRoleCommand> {
  constructor(
    @Inject('FamilyRepository')
    private readonly familyRepository: FamilyRepository,
  ) {}

  async execute(command: ChangeMemberRoleCommand): Promise<void> {
    const { familyId, userId, newRole, newResponsibility, changedBy } = command;

    const familyIdVO = new FamilyId(familyId);
    const userIdVO = new UserId(userId);
    const changedByVO = new UserId(changedBy);
    const newRoleVO = new FamilyRoleVO(newRole);
    const newResponsibilityVO = new FamilyResponsibilityVO(newResponsibility);

    const family = await this.familyRepository.findById(familyIdVO);
    if (!family) {
      throw new NotFoundException('Família não encontrada');
    }

    family.changeMemberRole(userIdVO, newRoleVO, newResponsibilityVO, changedByVO);

    await this.familyRepository.save(family);
  }
}
