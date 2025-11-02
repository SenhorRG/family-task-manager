import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('CQRS Load Tests', () => {
  let app: INestApplication;
  let userWriteModel: Model<any>;
  let userReadModel: Model<any>;
  let eventModel: Model<any>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userWriteModel = moduleFixture.get<Model<any>>(getModelToken('User', 'writeConnection'));
    userReadModel = moduleFixture.get<Model<any>>(getModelToken('User', 'readConnection'));
    eventModel = moduleFixture.get<Model<any>>(getModelToken('Event', 'eventsConnection'));
  });

  beforeEach(async () => {
    await userWriteModel.deleteMany({});
    await userReadModel.deleteMany({});
    await eventModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle concurrent user creation without race conditions', async () => {
    const concurrentRequests = 10;
    const requests = [];

    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(
        request(app.getHttpServer())
          .post('/users/register')
          .send({
            fullName: `User ${i}`,
            email: `user${i}@example.com`,
            password: 'password123',
          }),
      );
    }

    const responses = await Promise.all(requests);

    responses.forEach((response, index) => {
      expect([201, 409]).toContain(response.status);
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const writeCount = await userWriteModel.countDocuments();
    const readCount = await userReadModel.countDocuments();
    const eventCount = await eventModel.countDocuments({ aggregateType: 'User' });

    expect(Math.abs(writeCount - readCount)).toBeLessThanOrEqual(1);
    expect(eventCount).toBeGreaterThan(0);

    const allEvents = await eventModel.find({ aggregateType: 'User' }).exec();
    const versionMap = new Map<string, Set<number>>();

    allEvents.forEach((event) => {
      if (!versionMap.has(event.aggregateId)) {
        versionMap.set(event.aggregateId, new Set());
      }
      const versions = versionMap.get(event.aggregateId)!;
      expect(versions.has(event.version)).toBe(false);
      versions.add(event.version);
    });
  });

  it('should maintain read database sync under load', async () => {
    const numberOfUsers = 20;

    const userIds: string[] = [];
    for (let i = 0; i < numberOfUsers; i++) {
      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send({
          fullName: `Load Test User ${i}`,
          email: `loadtest${i}@example.com`,
          password: 'password123',
        })
        .expect(201);

      userIds.push(response.body.id);
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const writeCount = await userWriteModel.countDocuments();
    const readCount = await userReadModel.countDocuments();

    expect(writeCount).toBe(numberOfUsers);
    expect(readCount).toBe(numberOfUsers);

    for (const userId of userIds) {
      const userInWrite = await userWriteModel.findById(userId).exec();
      const userInRead = await userReadModel.findById(userId).exec();

      expect(userInWrite).toBeDefined();
      expect(userInRead).toBeDefined();
      expect(userInRead?.email).toBe(userInWrite?.email);
    }

    const eventCount = await eventModel.countDocuments({ aggregateType: 'User' });
    expect(eventCount).toBeGreaterThanOrEqual(numberOfUsers);
  });
});
