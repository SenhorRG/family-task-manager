import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Schema } from 'mongoose';

interface SyncReport {
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

async function verifySync() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const writeConnection = app.get<Connection>(getConnectionToken('writeConnection'));
  const readConnection = app.get<Connection>(getConnectionToken('readConnection'));
  const eventsConnection = app.get<Connection>(getConnectionToken('eventsConnection'));

  // Criar schemas temporários se não existirem
  const UserSchema = new Schema({}, { strict: false, collection: 'users' });
  const FamilySchema = new Schema({}, { strict: false, collection: 'families' });
  const TaskSchema = new Schema({}, { strict: false, collection: 'tasks' });
  const EventSchema = new Schema({}, { strict: false, collection: 'events' });

  const UserWriteModel = writeConnection.models.User || writeConnection.model('User', UserSchema);
  const UserReadModel = readConnection.models.User || readConnection.model('User', UserSchema);
  const FamilyWriteModel =
    writeConnection.models.Family || writeConnection.model('Family', FamilySchema);
  const FamilyReadModel =
    readConnection.models.Family || readConnection.model('Family', FamilySchema);
  const TaskWriteModel = writeConnection.models.Task || writeConnection.model('Task', TaskSchema);
  const TaskReadModel = readConnection.models.Task || readConnection.model('Task', TaskSchema);
  const EventModel = eventsConnection.models.Event || eventsConnection.model('Event', EventSchema);

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

  // Verificar Users
  console.log('🔍 Verificando Users...');
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
    // Verificar se existe pelo menos um evento de criação
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

  // Verificar Families
  console.log('🔍 Verificando Families...');
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

  // Verificar Tasks
  console.log('🔍 Verificando Tasks...');
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

  // Exibir relatório
  console.log('\n📊 Relatório de Sincronização\n');
  console.log('='.repeat(60));

  console.log('\n👥 USERS:');
  console.log(
    `  Write: ${report.users.writeCount} | Read: ${report.users.readCount} | Events: ${report.users.eventsCount}`,
  );
  if (report.users.missingInRead.length > 0) {
    console.log(`  ⚠️  Missing in Read: ${report.users.missingInRead.length}`);
  }
  if (report.users.missingInWrite.length > 0) {
    console.log(`  ⚠️  Missing in Write: ${report.users.missingInWrite.length}`);
  }
  if (report.users.missingEvents.length > 0) {
    console.log(`  ⚠️  Missing Events: ${report.users.missingEvents.length}`);
  }

  console.log('\n👨‍👩‍👧‍👦 FAMILIES:');
  console.log(
    `  Write: ${report.families.writeCount} | Read: ${report.families.readCount} | Events: ${report.families.eventsCount}`,
  );
  if (report.families.missingInRead.length > 0) {
    console.log(`  ⚠️  Missing in Read: ${report.families.missingInRead.length}`);
  }
  if (report.families.missingInWrite.length > 0) {
    console.log(`  ⚠️  Missing in Write: ${report.families.missingInWrite.length}`);
  }
  if (report.families.missingEvents.length > 0) {
    console.log(`  ⚠️  Missing Events: ${report.families.missingEvents.length}`);
  }

  console.log('\n📋 TASKS:');
  console.log(
    `  Write: ${report.tasks.writeCount} | Read: ${report.tasks.readCount} | Events: ${report.tasks.eventsCount}`,
  );
  if (report.tasks.missingInRead.length > 0) {
    console.log(`  ⚠️  Missing in Read: ${report.tasks.missingInRead.length}`);
  }
  if (report.tasks.missingInWrite.length > 0) {
    console.log(`  ⚠️  Missing in Write: ${report.tasks.missingInWrite.length}`);
  }
  if (report.tasks.missingEvents.length > 0) {
    console.log(`  ⚠️  Missing Events: ${report.tasks.missingEvents.length}`);
  }

  console.log('\n📈 RESUMO:');
  if (report.summary.isSync) {
    console.log('  ✅ Sistema está sincronizado!');
  } else {
    console.log(`  ❌ Encontradas ${report.summary.totalInconsistencies} inconsistências`);
  }

  console.log('\n' + '='.repeat(60));

  await app.close();

  process.exit(report.summary.isSync ? 0 : 1);
}

verifySync().catch((error) => {
  console.error('❌ Erro ao verificar sincronização:', error);
  process.exit(1);
});
