import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseEvent } from '../../../shared';
import { FamilyFactory } from '../../domain/services';
import { Family } from '../../domain/aggregates';
import { FamilySchema } from '../../infrastructure/persistence/mongoose/schemas';
import { AggregateRehydrator } from '../../../shared/domain/ports/aggregate-rehydrator.port';

@Injectable()
export class FamilyRehydratorAdapter implements AggregateRehydrator<Family> {
  constructor(
    private readonly familyFactory: FamilyFactory,
    @InjectModel(FamilySchema.name, 'writeConnection')
    private readonly writeModel: Model<FamilySchema>,
  ) {}

  getAggregateType(): string {
    return 'Family';
  }

  async checkExists(aggregateId: string): Promise<boolean> {
    const exists = await this.writeModel.findById(aggregateId).exec();
    return !!exists;
  }

  async rehydrateAggregate(aggregateId: string, events: BaseEvent[]): Promise<Family> {
    return Promise.resolve(this.familyFactory.reconstructFamilyFromEvents(aggregateId, events));
  }

  async saveWithoutEvents(family: Family): Promise<void> {
    const familyData = {
      _id: family.familyId.value,
      name: family.name.value,
      members: family.members.map((member) => ({
        userId: member.userId.value,
        role: member.role.value,
        responsibility: member.responsibility.value,
        joinedAt: member.joinedAt,
      })),
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
    };

    try {
      await this.writeModel.create(familyData);
    } catch (error) {
      if (error.code === 11000) {
        await this.writeModel.findByIdAndUpdate(family.familyId.value, familyData, {
          new: true,
        });
      } else {
        throw error;
      }
    }
  }
}
