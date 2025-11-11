import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { Inject, NotFoundException } from '@nestjs/common';
import { UserReadRepository } from '../../ports';
import { UserId } from '../../../domain';
import { UserReadDto } from '../../dtos';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(
    @Inject('UserReadRepository')
    private readonly userReadRepository: UserReadRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserReadDto> {
    const { userId } = query;
    const userIdVO = new UserId(userId);

    const user = await this.userReadRepository.findById(userIdVO);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
