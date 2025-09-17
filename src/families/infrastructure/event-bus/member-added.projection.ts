import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberAddedEvent } from '../../domain/events';
import { FamilySchema } from '../persistence/mongoose/schemas';

@Injectable()
export class MemberAddedProjection {
  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilySchema>,
  ) {}

  async handle(event: MemberAddedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    await this.readModel.findByIdAndUpdate(aggregateId, {
      $push: {
        members: {
          userId: eventData.userId,
          role: eventData.role,
          responsibility: eventData.responsibility,
          joinedAt: eventData.addedAt,
        },
      },
      $set: {
        updatedAt: eventData.addedAt,
      },
    });
  }
}
