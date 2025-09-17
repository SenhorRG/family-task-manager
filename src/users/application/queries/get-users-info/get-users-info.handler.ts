import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { GetUsersInfoQuery } from './get-users-info.query';
import { GetUserByIdQuery } from '../get-user-by-id';

export interface UserInfo {
  id: string;
  fullName: string;
  email: string;
}

@QueryHandler(GetUsersInfoQuery)
export class GetUsersInfoHandler implements IQueryHandler<GetUsersInfoQuery> {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(query: GetUsersInfoQuery): Promise<Map<string, UserInfo>> {
    const { userIds } = query;
    const usersInfo = new Map<string, UserInfo>();

    const userPromises = userIds.map(async (userId) => {
      try {
        const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
        if (user) {
          const userInfo: UserInfo = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          };
          usersInfo.set(userId, userInfo);
        }
      } catch (error) {
        console.error(`Error fetching user info for user ${userId}:`, error);
      }
    });

    await Promise.all(userPromises);
    return usersInfo;
  }
}
