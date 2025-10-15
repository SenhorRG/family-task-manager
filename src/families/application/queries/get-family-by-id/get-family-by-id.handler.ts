import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFamilyByIdQuery } from './get-family-by-id.query';
import { FamilyReadRepository } from '../../../application/ports';
import { FamilyId } from '../../../domain/value-objects';
import { NotFoundException, Inject } from '@nestjs/common';

@QueryHandler(GetFamilyByIdQuery)
export class GetFamilyByIdHandler implements IQueryHandler<GetFamilyByIdQuery> {
  constructor(
    @Inject('FamilyReadRepository')
    private readonly familyReadRepository: FamilyReadRepository,
  ) {}

  async execute(query: GetFamilyByIdQuery): Promise<any> {
    const { familyId } = query;
    const familyIdVO = new FamilyId(familyId);

    const family = await this.familyReadRepository.findById(familyIdVO);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    return family;
  }
}
