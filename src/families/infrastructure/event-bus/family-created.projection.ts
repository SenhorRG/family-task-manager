import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyCreatedEvent } from '../../domain/events';
import { FamilySchema } from '../persistence/mongoose/schemas';

@Injectable()
export class FamilyCreatedProjection {
  private readonly logger = new Logger(FamilyCreatedProjection.name);

  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilySchema>,
  ) {}

  async handle(event: FamilyCreatedEvent): Promise<void> {
    try {
      const { aggregateId, eventData } = event;

      const existing = await this.readModel.findById(aggregateId).exec();
      if (existing) {
        this.logger.warn(
          `Family ${aggregateId} already exists in read database, skipping projection`,
        );
        return;
      }

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
      this.logger.log(`Family ${aggregateId} projected to read database`);
    } catch (error) {
      this.logger.error(`Error projecting FamilyCreatedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
