import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateFamilyCommand } from './create-family.command';
import { FamilyFactory } from '../../../domain/services';
import { FamilyRepository } from '../../../domain/ports';
import { UserId } from '../../../../users/domain/value-objects';
import { ConflictException, Inject } from '@nestjs/common';

@CommandHandler(CreateFamilyCommand)
export class CreateFamilyHandler implements ICommandHandler<CreateFamilyCommand> {
  constructor(
    private readonly familyFactory: FamilyFactory,
    @Inject('FamilyRepository')
    private readonly familyRepository: FamilyRepository,
  ) {}

  async execute(command: CreateFamilyCommand): Promise<void> {
    const { name, principalResponsibleUserId, principalRole } = command;

    const principalUserId = new UserId(principalResponsibleUserId);

    const existingFamily = await this.familyRepository.findByPrincipalResponsible(principalUserId);
    if (existingFamily) {
      throw new ConflictException('The user is already principal responsible of a family');
    }

    const family = this.familyFactory.createFamily(name, principalResponsibleUserId, principalRole);

    await this.familyRepository.save(family);
  }
}
