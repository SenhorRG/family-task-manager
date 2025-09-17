import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RemoveMemberCommand } from './remove-member.command';
import { FamilyRepository } from '../../../domain/ports';
import { FamilyId } from '../../../domain/value-objects';
import { UserId } from '../../../../users/domain/value-objects';
import { NotFoundException, Inject } from '@nestjs/common';

@CommandHandler(RemoveMemberCommand)
export class RemoveMemberHandler implements ICommandHandler<RemoveMemberCommand> {
  constructor(
    @Inject('FamilyRepository')
    private readonly familyRepository: FamilyRepository,
  ) {}

  async execute(command: RemoveMemberCommand): Promise<void> {
    const { familyId, userId, removedBy } = command;

    const familyIdVO = new FamilyId(familyId);
    const userIdVO = new UserId(userId);
    const removedByVO = new UserId(removedBy);

    const family = await this.familyRepository.findById(familyIdVO);
    if (!family) {
      throw new NotFoundException('Família não encontrada');
    }

    family.removeMember(userIdVO, removedByVO);

    await this.familyRepository.save(family);
  }
}
