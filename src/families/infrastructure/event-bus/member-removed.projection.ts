import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberRemovedEvent } from '../../domain/events';
import { FamilySchema } from '../persistence/mongoose/schemas';

@Injectable()
export class MemberRemovedProjection {
  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilySchema>,
  ) {}

  async handle(event: MemberRemovedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    await this.readModel.findByIdAndUpdate(aggregateId, {
      $pull: {
        members: {
          userId: eventData.userId,
        },
      },
      $set: {
        updatedAt: eventData.removedAt,
      },
    });
  }
}
