import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserReadRepository } from '../../../../application/ports';
import { UserReadDto } from '../../../../application/dtos';
import { UserId } from '../../../../domain';
import { UserReadSchema } from '../schemas/user-read.schema';

@Injectable()
export class MongoUserReadRepository implements UserReadRepository {
  constructor(
    @InjectModel(UserReadSchema.name, 'readConnection')
    private readonly readModel: Model<UserReadSchema>,
  ) {}

  async findById(id: UserId): Promise<UserReadDto | null> {
    const userDoc = await this.readModel.findById(id.value).exec();
    if (!userDoc) {
      return null;
    }

    return new UserReadDto(
      userDoc._id.toString(),
      userDoc.fullName,
      userDoc.email,
      userDoc.createdAt,
      userDoc.updatedAt,
    );
  }

  async findByEmail(email: string): Promise<UserReadDto | null> {
    const userDoc = await this.readModel.findOne({ email }).exec();
    if (!userDoc) {
      return null;
    }

    return new UserReadDto(
      userDoc._id.toString(),
      userDoc.fullName,
      userDoc.email,
      userDoc.createdAt,
      userDoc.updatedAt,
    );
  }

  async findAll(): Promise<UserReadDto[]> {
    const userDocs = await this.readModel.find().exec();

    return userDocs.map(
      (userDoc) =>
        new UserReadDto(
          userDoc._id.toString(),
          userDoc.fullName,
          userDoc.email,
          userDoc.createdAt,
          userDoc.updatedAt,
        ),
    );
  }
}
