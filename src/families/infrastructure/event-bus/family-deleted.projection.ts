import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyDeletedEvent } from '../../domain/events';
import { FamilySchema } from '../persistence/mongoose/schemas';

@Injectable()
export class FamilyDeletedProjection {
  private readonly logger = new Logger(FamilyDeletedProjection.name);

  constructor(
    @InjectModel(FamilySchema.name, 'readConnection')
    private readonly readModel: Model<FamilySchema>,
  ) {}

  async handle(event: FamilyDeletedEvent): Promise<void> {
    try {
      const { aggregateId } = event;
      const family = await this.readModel.findById(aggregateId).exec();
      if (!family) {
        this.logger.warn(
          `Family ${aggregateId} not found in read database, skipping delete projection`,
        );
        return;
      }

      await this.readModel.findByIdAndDelete(aggregateId);
      this.logger.log(`Family ${aggregateId} deleted from read database`);
    } catch (error) {
      this.logger.error(`Error projecting FamilyDeletedEvent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
