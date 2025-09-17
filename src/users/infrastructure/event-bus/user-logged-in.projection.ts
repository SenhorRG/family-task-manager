import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLoggedInEvent } from '../../domain';
import { UserSchema } from '../persistence';

@Injectable()
export class UserLoggedInProjection {
  constructor(
    @InjectModel(UserSchema.name, 'readConnection')
    private readonly readModel: Model<UserSchema>,
  ) {}

  async handle(event: UserLoggedInEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    await this.readModel.findByIdAndUpdate(aggregateId, {
      lastLoginAt: eventData.loggedInAt,
      updatedAt: eventData.loggedInAt,
    });
  }
}
