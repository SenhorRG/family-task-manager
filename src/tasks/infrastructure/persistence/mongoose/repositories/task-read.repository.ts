import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryBus } from '@nestjs/cqrs';
import { TaskReadRepository } from '../../../../application/ports';
import { TaskId } from '../../../../domain/value-objects';
import { FamilyId } from '../../../../../families/domain/value-objects';
import { UserId } from '../../../../../users/domain/value-objects';
import { TaskReadDto } from '../../../../application/dtos';
import { TaskDocument, TaskSchema } from '../schemas';
import { GetUsersInfoQuery } from '../../../../../users/application/queries';

@Injectable()
export class MongoTaskReadRepository implements TaskReadRepository {
  constructor(
    @InjectModel(TaskSchema.name, 'readConnection')
    private readonly readModel: Model<TaskDocument>,
    private readonly queryBus: QueryBus,
  ) {}

  private async enrichTaskWithUserInfo(taskDoc: TaskDocument): Promise<TaskReadDto> {
    const userIds = new Set<string>();
    userIds.add(taskDoc.createdBy);

    taskDoc.assignments.forEach((assignment) => {
      userIds.add(assignment.assignedTo);
      userIds.add(assignment.assignedBy);
    });

    const usersInfo = await this.queryBus.execute(new GetUsersInfoQuery(Array.from(userIds)));

    const enrichedAssignments = taskDoc.assignments.map((assignment) => ({
      assignedTo: {
        memberId: assignment.assignedTo,
        memberName: usersInfo.get(assignment.assignedTo)?.fullName || 'User not found',
      },
      assignedBy: {
        memberId: assignment.assignedBy,
        memberName: usersInfo.get(assignment.assignedBy)?.fullName || 'User not found',
      },
      assignedAt: assignment.assignedAt,
    }));

    return new TaskReadDto(
      taskDoc._id.toString(),
      taskDoc.title,
      taskDoc.description,
      taskDoc.familyId,
      enrichedAssignments,
      taskDoc.status,
      taskDoc.createdBy,
      taskDoc.createdAt,
      taskDoc.updatedAt,
      taskDoc.dueDate,
      taskDoc.location,
    );
  }

  async findById(id: TaskId): Promise<TaskReadDto | null> {
    const taskDoc = await this.readModel.findById(id.value).exec();
    if (!taskDoc) {
      return null;
    }

    return this.enrichTaskWithUserInfo(taskDoc);
  }

  async findByFamily(familyId: FamilyId): Promise<TaskReadDto[]> {
    const taskDocs = await this.readModel.find({ familyId: familyId.value }).exec();

    return Promise.all(taskDocs.map((taskDoc) => this.enrichTaskWithUserInfo(taskDoc)));
  }

  async findByAssignedTo(userId: UserId): Promise<TaskReadDto[]> {
    const taskDocs = await this.readModel
      .find({
        'assignments.assignedTo': userId.value,
      })
      .exec();

    return Promise.all(taskDocs.map((taskDoc) => this.enrichTaskWithUserInfo(taskDoc)));
  }

  async findByCreatedBy(userId: UserId): Promise<TaskReadDto[]> {
    const taskDocs = await this.readModel.find({ createdBy: userId.value }).exec();

    return Promise.all(taskDocs.map((taskDoc) => this.enrichTaskWithUserInfo(taskDoc)));
  }

  async findAll(): Promise<TaskReadDto[]> {
    const taskDocs = await this.readModel.find().exec();

    return Promise.all(taskDocs.map((taskDoc) => this.enrichTaskWithUserInfo(taskDoc)));
  }
}
