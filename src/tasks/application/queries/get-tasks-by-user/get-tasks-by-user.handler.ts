import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetTasksByUserQuery } from './get-tasks-by-user.query';
import { TaskReadRepository } from '../../../application/ports';
import { UserId } from '../../../../users/domain/value-objects';
import { Inject } from '@nestjs/common';

@QueryHandler(GetTasksByUserQuery)
export class GetTasksByUserHandler implements IQueryHandler<GetTasksByUserQuery> {
  constructor(
    @Inject('TaskReadRepository')
    private readonly taskReadRepository: TaskReadRepository,
  ) {}

  async execute(query: GetTasksByUserQuery): Promise<any[]> {
    const { userId } = query;
    const userIdVO = new UserId(userId);

    return this.taskReadRepository.findByAssignedTo(userIdVO);
  }
}
