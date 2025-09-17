import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberRoleChangedEvent } from '../../domain/events';
import { FamilySchema } from '../persistence/mongoose/schemas';

@Injectable()
export class MemberRoleChangedProjection {
  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilySchema>,
  ) {}

  async handle(event: MemberRoleChangedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    await this.readModel.updateOne(
      {
        _id: aggregateId,
        'members.userId': eventData.userId,
      },
      {
        $set: {
          'members.$.role': eventData.newRole,
          'members.$.responsibility': eventData.newResponsibility,
          updatedAt: eventData.changedAt,
        },
      },
    );
  }
}
