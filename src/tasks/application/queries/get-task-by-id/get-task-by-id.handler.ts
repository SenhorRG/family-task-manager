import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetTaskByIdQuery } from './get-task-by-id.query';
import { TaskReadRepository } from '../../../application/ports';
import { TaskId } from '../../../domain/value-objects';
import { NotFoundException, Inject } from '@nestjs/common';

@QueryHandler(GetTaskByIdQuery)
export class GetTaskByIdHandler implements IQueryHandler<GetTaskByIdQuery> {
  constructor(
    @Inject('TaskReadRepository')
    private readonly taskReadRepository: TaskReadRepository,
  ) {}

  async execute(query: GetTaskByIdQuery): Promise<any> {
    const { taskId } = query;
    const taskIdVO = new TaskId(taskId);

    const task = await this.taskReadRepository.findById(taskIdVO);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
