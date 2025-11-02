import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MemberAddedEvent } from '../../domain/events';
import { FamilySchema } from '../persistence/mongoose/schemas';

@Injectable()
export class MemberAddedProjection {
  private readonly logger = new Logger(MemberAddedProjection.name);

  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilySchema>,
  ) {}

  async handle(event: MemberAddedEvent): Promise<void> {
    try {
      const { aggregateId, eventData } = event;

      const family = await this.readModel.findById(aggregateId).exec();
      if (!family) {
        this.logger.warn(`Family ${aggregateId} not found in read database, skipping projection`);
        return;
      }

      const memberExists = family.members.some((m) => m.userId === eventData.userId);
      if (memberExists) {
        this.logger.warn(
          `Member ${eventData.userId} already exists in family ${aggregateId}, skipping projection`,
        );
        return;
      }

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

      this.logger.log(`Member ${eventData.userId} added to family ${aggregateId}`);
    } catch (error) {
      this.logger.error(`Error projecting MemberAddedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
