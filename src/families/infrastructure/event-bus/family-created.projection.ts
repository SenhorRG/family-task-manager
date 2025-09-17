import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyCreatedEvent } from '../../domain/events';
import { FamilySchema } from '../persistence/mongoose/schemas';

@Injectable()
export class FamilyCreatedProjection {
  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilySchema>,
  ) {}

  async handle(event: FamilyCreatedEvent): Promise<void> {
    const { aggregateId, eventData } = event;

    const familyData = {
      _id: aggregateId,
      name: eventData.name,
      members: [
        {
          userId: eventData.principalResponsibleUserId,
          role: eventData.principalRole,
          responsibility: 'PRINCIPAL_RESPONSIBLE',
          joinedAt: eventData.createdAt,
        },
      ],
      createdAt: eventData.createdAt,
      updatedAt: eventData.createdAt,
    };

    await this.readModel.create(familyData);
  }
}
