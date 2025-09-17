import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCreatedEvent } from '../../domain';
import { UserSchema } from '../persistence';

@Injectable()
export class UserCreatedProjection {
  constructor(
    @InjectModel(UserSchema.name, 'readConnection')
    private readonly readModel: Model<UserSchema>,
    @InjectModel(UserSchema.name, 'writeConnection')
    private readonly writeModel: Model<UserSchema>,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    const userFromWrite = await this.writeModel.findById(aggregateId).exec();

    if (!userFromWrite) {
      throw new Error(`User not found in write database: ${aggregateId}`);
    }

    const userData = {
      _id: aggregateId,
      fullName: eventData.fullName,
      email: eventData.email,
      password: userFromWrite.password,
      createdAt: eventData.createdAt,
      updatedAt: eventData.createdAt,
    };

    await this.readModel.create(userData);
  }
}
