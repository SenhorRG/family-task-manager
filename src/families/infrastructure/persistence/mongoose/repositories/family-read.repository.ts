import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryBus } from '@nestjs/cqrs';
import { FamilyReadRepository } from '../../../../application/ports';
import { FamilyId } from '../../../../domain/value-objects';
import { UserId } from '../../../../../users/domain/value-objects';
import { FamilyReadDto } from '../../../../application/dtos';
import { FamilyDocument, FamilySchema } from '../schemas';
import { GetUsersInfoQuery } from '../../../../../users/application/queries';

@Injectable()
export class MongoFamilyReadRepository implements FamilyReadRepository {
  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilyDocument>,
    private readonly queryBus: QueryBus,
  ) {}

  private async enrichFamilyWithUserInfo(familyDoc: FamilyDocument): Promise<FamilyReadDto> {
    const userIds = familyDoc.members.map((member) => member.userId);

    const usersInfo = await this.queryBus.execute(new GetUsersInfoQuery(userIds));

    const enrichedMembers = familyDoc.members.map((member) => ({
      userId: member.userId,
      memberName: usersInfo.get(member.userId)?.fullName || 'User not found',
      role: member.role,
      responsibility: member.responsibility,
      joinedAt: member.joinedAt,
    }));

    return new FamilyReadDto(
      familyDoc._id.toString(),
      familyDoc.name,
      enrichedMembers,
      familyDoc.createdAt,
      familyDoc.updatedAt,
    );
  }

  async findById(id: FamilyId): Promise<FamilyReadDto | null> {
    const familyDoc = await this.readModel.findById(id.value).exec();
    if (!familyDoc) {
      return null;
    }

    return this.enrichFamilyWithUserInfo(familyDoc);
  }

  async findByMember(userId: UserId): Promise<FamilyReadDto[]> {
    const familyDocs = await this.readModel
      .find({
        'members.userId': userId.value,
      })
      .exec();

    return Promise.all(familyDocs.map((familyDoc) => this.enrichFamilyWithUserInfo(familyDoc)));
  }

  async findAll(): Promise<FamilyReadDto[]> {
    const familyDocs = await this.readModel.find().exec();

    return Promise.all(familyDocs.map((familyDoc) => this.enrichFamilyWithUserInfo(familyDoc)));
  }
}
