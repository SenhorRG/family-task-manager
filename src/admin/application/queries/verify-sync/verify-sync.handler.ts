import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, Inject } from '@nestjs/common';
import { VerifySyncQuery } from './verify-sync.query';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Schema } from 'mongoose';

export interface SyncReport {
  users: {
    writeCount: number;
    readCount: number;
    eventsCount: number;
    missingInRead: string[];
    missingInWrite: string[];
    missingEvents: string[];
  };
  families: {
    writeCount: number;
    readCount: number;
    eventsCount: number;
    missingInRead: string[];
    missingInWrite: string[];
    missingEvents: string[];
  };
  tasks: {
    writeCount: number;
    readCount: number;
    eventsCount: number;
    missingInRead: string[];
    missingInWrite: string[];
    missingEvents: string[];
  };
  summary: {
    totalInconsistencies: number;
    isSync: boolean;
  };
}

@QueryHandler(VerifySyncQuery)
export class VerifySyncHandler implements IQueryHandler<VerifySyncQuery> {
  private readonly logger = new Logger(VerifySyncHandler.name);

  constructor(
    @Inject(getConnectionToken('writeConnection'))
    private readonly writeConnection: Connection,
    @Inject(getConnectionToken('readConnection'))
    private readonly readConnection: Connection,
    @Inject(getConnectionToken('eventsConnection'))
    private readonly eventsConnection: Connection,
  ) {}

  async execute(): Promise<SyncReport> {
    this.logger.log('🔍 Verificando sincronização entre write, read e events databases...');

    const UserSchema = new Schema({}, { strict: false, collection: 'users' });
    const FamilySchema = new Schema({}, { strict: false, collection: 'families' });
    const TaskSchema = new Schema({}, { strict: false, collection: 'tasks' });
    const EventSchema = new Schema({}, { strict: false, collection: 'events' });

    const UserWriteModel =
      this.writeConnection.models.User || this.writeConnection.model('User', UserSchema);
    const UserReadModel =
      this.readConnection.models.User || this.readConnection.model('User', UserSchema);
    const FamilyWriteModel =
      this.writeConnection.models.Family || this.writeConnection.model('Family', FamilySchema);
    const FamilyReadModel =
      this.readConnection.models.Family || this.readConnection.model('Family', FamilySchema);
    const TaskWriteModel =
      this.writeConnection.models.Task || this.writeConnection.model('Task', TaskSchema);
    const TaskReadModel =
      this.readConnection.models.Task || this.readConnection.model('Task', TaskSchema);
    const EventModel =
      this.eventsConnection.models.Event || this.eventsConnection.model('Event', EventSchema);

    const report: SyncReport = {
      users: {
        writeCount: 0,
        readCount: 0,
        eventsCount: 0,
        missingInRead: [],
        missingInWrite: [],
        missingEvents: [],
      },
      families: {
        writeCount: 0,
        readCount: 0,
        eventsCount: 0,
        missingInRead: [],
        missingInWrite: [],
        missingEvents: [],
      },
      tasks: {
        writeCount: 0,
        readCount: 0,
        eventsCount: 0,
        missingInRead: [],
        missingInWrite: [],
        missingEvents: [],
      },
      summary: {
        totalInconsistencies: 0,
        isSync: false,
      },
    };

    this.logger.log('🔍 Verificando Users...');
    const usersWrite = await UserWriteModel.find().exec();
    const usersRead = await UserReadModel.find().exec();
    const userEvents = await EventModel.find({ aggregateType: 'User' }).exec();

    report.users.writeCount = usersWrite.length;
    report.users.readCount = usersRead.length;
    report.users.eventsCount = userEvents.length;

    const userWriteIds = new Set(usersWrite.map((u) => u._id.toString()));
    const userReadIds = new Set(usersRead.map((u) => u._id.toString()));
    const userEventIds = new Set(userEvents.map((e) => e.aggregateId));

    usersWrite.forEach((u) => {
      const id = u._id.toString();
      if (!userReadIds.has(id)) {
        report.users.missingInRead.push(id);
        report.summary.totalInconsistencies++;
      }
      const hasCreatedEvent = userEvents.some(
        (e) => e.aggregateId === id && e.eventType === 'UserCreatedEvent',
      );
      if (!hasCreatedEvent) {
        report.users.missingEvents.push(id);
        report.summary.totalInconsistencies++;
      }
    });

    usersRead.forEach((u) => {
      const id = u._id.toString();
      if (!userWriteIds.has(id)) {
        report.users.missingInWrite.push(id);
        report.summary.totalInconsistencies++;
      }
    });

    this.logger.log('🔍 Verificando Families...');
    const familiesWrite = await FamilyWriteModel.find().exec();
    const familiesRead = await FamilyReadModel.find().exec();
    const familyEvents = await EventModel.find({ aggregateType: 'Family' }).exec();

    report.families.writeCount = familiesWrite.length;
    report.families.readCount = familiesRead.length;
    report.families.eventsCount = familyEvents.length;

    const familyWriteIds = new Set(familiesWrite.map((f) => f._id.toString()));
    const familyReadIds = new Set(familiesRead.map((f) => f._id.toString()));
    const familyEventIds = new Set(familyEvents.map((e) => e.aggregateId));

    familiesWrite.forEach((f) => {
      const id = f._id.toString();
      if (!familyReadIds.has(id)) {
        report.families.missingInRead.push(id);
        report.summary.totalInconsistencies++;
      }
      const hasCreatedEvent = familyEvents.some(
        (e) => e.aggregateId === id && e.eventType === 'FamilyCreatedEvent',
      );
      if (!hasCreatedEvent) {
        report.families.missingEvents.push(id);
        report.summary.totalInconsistencies++;
      }
    });

    familiesRead.forEach((f) => {
      const id = f._id.toString();
      if (!familyWriteIds.has(id)) {
        report.families.missingInWrite.push(id);
        report.summary.totalInconsistencies++;
      }
    });

    this.logger.log('🔍 Verificando Tasks...');
    const tasksWrite = await TaskWriteModel.find().exec();
    const tasksRead = await TaskReadModel.find().exec();
    const taskEvents = await EventModel.find({ aggregateType: 'Task' }).exec();

    report.tasks.writeCount = tasksWrite.length;
    report.tasks.readCount = tasksRead.length;
    report.tasks.eventsCount = taskEvents.length;

    const taskWriteIds = new Set(tasksWrite.map((t) => t._id.toString()));
    const taskReadIds = new Set(tasksRead.map((t) => t._id.toString()));
    const taskEventIds = new Set(taskEvents.map((e) => e.aggregateId));

    tasksWrite.forEach((t) => {
      const id = t._id.toString();
      if (!taskReadIds.has(id)) {
        report.tasks.missingInRead.push(id);
        report.summary.totalInconsistencies++;
      }
      const hasCreatedEvent = taskEvents.some(
        (e) => e.aggregateId === id && e.eventType === 'TaskCreatedEvent',
      );
      if (!hasCreatedEvent) {
        report.tasks.missingEvents.push(id);
        report.summary.totalInconsistencies++;
      }
    });

    tasksRead.forEach((t) => {
      const id = t._id.toString();
      if (!taskWriteIds.has(id)) {
        report.tasks.missingInWrite.push(id);
        report.summary.totalInconsistencies++;
      }
    });

    report.summary.isSync = report.summary.totalInconsistencies === 0;

    this.logger.log(
      `✅ Verificação concluída: ${report.summary.isSync ? 'Sistema sincronizado' : `${report.summary.totalInconsistencies} inconsistências encontradas`}`,
    );

    return report;
  }
}
