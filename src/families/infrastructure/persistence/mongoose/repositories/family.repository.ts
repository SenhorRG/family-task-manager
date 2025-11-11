import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventBus } from '@nestjs/cqrs';
import { FamilyRepository } from '../../../../domain/ports';
import { Family } from '../../../../domain/aggregates';
import { UserId } from '../../../../../users/domain/value-objects';
import { FamilyDocument, FamilySchema } from '../schemas';
import { EventStore } from '../../../../../shared';
import {
  FamilyId,
  FamilyRoleVO,
  FamilyRole,
  FamilyNameVO,
  FamilyMemberVO,
  FamilyResponsibility,
  FamilyResponsibilityVO,
} from '../../../../domain/value-objects';

@Injectable()
export class MongoFamilyRepository implements FamilyRepository {
  constructor(
    @InjectModel(FamilySchema.name, 'writeConnection')
    private readonly writeModel: Model<FamilyDocument>,
    @Inject('EventStore')
    private readonly eventStore: EventStore,
    private readonly eventBus: EventBus,
  ) {}

  async save(family: Family): Promise<void> {
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
      version: family.version,
    };

    await this.writeModel.findByIdAndUpdate(family.familyId.value, familyData, {
      upsert: true,
      new: true,
    });

    const uncommittedEvents = family.uncommittedEvents;
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(
        family.familyId.value,
        uncommittedEvents,
        family.version - uncommittedEvents.length,
      );

      for (const event of uncommittedEvents) {
        await this.eventBus.publish(event);
      }

      family.markEventsAsCommitted();
    }
  }

  async findById(id: FamilyId): Promise<Family | null> {
    const familyDoc = await this.writeModel.findById(id.value).exec();
    if (!familyDoc) {
      return null;
    }

    return this.mapToDomain(familyDoc);
  }

  async findByPrincipalResponsible(userId: UserId): Promise<Family | null> {
    const familyDoc = await this.writeModel
      .findOne({
        'members.userId': userId.value,
        'members.responsibility': 'PRINCIPAL_RESPONSIBLE',
      })
      .exec();

    if (!familyDoc) {
      return null;
    }

    return this.mapToDomain(familyDoc);
  }

  async findByMember(userId: UserId): Promise<Family[]> {
    const familyDocs = await this.writeModel
      .find({
        'members.userId': userId.value,
      })
      .exec();

    return familyDocs.map((doc) => this.mapToDomain(doc));
  }

  async delete(id: FamilyId): Promise<void> {
    await this.writeModel.findByIdAndDelete(id.value);
  }

  private mapToDomain(familyDoc: FamilyDocument): Family {
    const familyId = new FamilyId(familyDoc._id.toString());
    const familyName = new FamilyNameVO(familyDoc.name);

    const familyMembers = familyDoc.members.map((member) => {
      const userId = new UserId(member.userId);
      const role = new FamilyRoleVO(member.role as FamilyRole);
      const responsibility = new FamilyResponsibilityVO(
        member.responsibility as FamilyResponsibility,
      );
      return new FamilyMemberVO(userId, role, responsibility, member.joinedAt);
    });

    const family = new Family(
      familyId,
      familyName,
      familyMembers[0],
      familyMembers,
      familyDoc.createdAt,
      familyDoc.updatedAt,
    );
    family.restoreVersion(familyDoc.version ?? 0);
    return family;
  }
}
