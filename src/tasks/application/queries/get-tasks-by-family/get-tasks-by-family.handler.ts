import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetTasksByFamilyQuery } from './get-tasks-by-family.query';
import { TaskReadRepository } from '../../../application/ports';
import { FamilyId } from '../../../../families/domain/value-objects';
import { Inject } from '@nestjs/common';

@QueryHandler(GetTasksByFamilyQuery)
export class GetTasksByFamilyHandler implements IQueryHandler<GetTasksByFamilyQuery> {
  constructor(
    @Inject('TaskReadRepository')
    private readonly taskReadRepository: TaskReadRepository,
  ) {}

  async execute(query: GetTasksByFamilyQuery): Promise<any[]> {
    const { familyId } = query;
    const familyIdVO = new FamilyId(familyId);

    return this.taskReadRepository.findByFamily(familyIdVO);
  }
}
