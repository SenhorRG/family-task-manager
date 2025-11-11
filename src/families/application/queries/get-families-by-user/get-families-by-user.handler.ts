import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetFamiliesByUserQuery } from './get-families-by-user.query';
import { FamilyReadRepository } from '../../../application/ports';
import { UserId } from '../../../../users/domain/value-objects';
import { Inject } from '@nestjs/common';
import { FamilyReadDto } from '../../dtos';

@QueryHandler(GetFamiliesByUserQuery)
export class GetFamiliesByUserHandler implements IQueryHandler<GetFamiliesByUserQuery> {
  constructor(
    @Inject('FamilyReadRepository')
    private readonly familyReadRepository: FamilyReadRepository,
  ) {}

  async execute(query: GetFamiliesByUserQuery): Promise<FamilyReadDto[]> {
    const { userId } = query;
    const userIdVO = new UserId(userId);

    return this.familyReadRepository.findByMember(userIdVO);
  }
}
