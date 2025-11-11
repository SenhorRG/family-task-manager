import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from '../../src/users/infrastructure/persistence/mongoose/schemas/user.schema';
import { UserReadDocument } from '../../src/users/infrastructure/persistence/mongoose/schemas/user-read.schema';
import { FamilyDocument } from '../../src/families/infrastructure/persistence/mongoose/schemas/family.schema';
import { EventDocument } from '../../src/shared/infrastructure/event-store/mongo-event-store';
import { FamilyReadDto } from '../../src/families/application/dtos';

const waitForProjection = async (timeout = 750) =>
  new Promise<void>((resolve) => setTimeout(resolve, timeout));

describe('CQRS Event Sourcing Integration Tests', () => {
  let app: INestApplication;
  let userWriteModel: Model<UserDocument>;
  let userReadModel: Model<UserReadDocument>;
  let familyWriteModel: Model<FamilyDocument>;
  let familyReadModel: Model<FamilyDocument>;
  let eventModel: Model<EventDocument>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userWriteModel = moduleFixture.get<Model<UserDocument>>(
      getModelToken('User', 'writeConnection'),
    );
    userReadModel = moduleFixture.get<Model<UserReadDocument>>(
      getModelToken('User', 'readConnection'),
    );
    familyWriteModel = moduleFixture.get<Model<FamilyDocument>>(
      getModelToken('Family', 'writeConnection'),
    );
    familyReadModel = moduleFixture.get<Model<FamilyDocument>>(
      getModelToken('Family', 'readConnection'),
    );
    eventModel = moduleFixture.get<Model<EventDocument>>(
      getModelToken('Event', 'eventsConnection'),
    );
  });

  beforeEach(async () => {
    await Promise.all([
      userWriteModel.deleteMany({}),
      userReadModel.deleteMany({}),
      familyWriteModel.deleteMany({}),
      familyReadModel.deleteMany({}),
      eventModel.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Users', () => {
    it('registers a user and exposes it through the read model', async () => {
      const userData = {
        fullName: 'Projection Test User',
        email: 'projection@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer()).post('/users/register').send(userData).expect(201);

      await waitForProjection();

      const writeUser = await userWriteModel.findOne({ email: userData.email }).exec();
      expect(writeUser).not.toBeNull();

      const readUser = await userReadModel.findOne({ email: userData.email }).exec();
      expect(readUser).not.toBeNull();
      expect(readUser?.fullName).toBe(userData.fullName);

      const events = await eventModel
        .find({ aggregateType: 'User', aggregateId: writeUser?.id })
        .exec();
      expect(events.some((event) => event.eventType === 'UserCreatedEvent')).toBe(true);
    });

    it('authenticates an existing user and returns typed payload', async () => {
      const userCredentials = {
        fullName: 'Login User',
        email: 'login@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer()).post('/users/register').send(userCredentials).expect(201);
      await waitForProjection();

      const loginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({ email: userCredentials.email, password: userCredentials.password })
        .expect(201);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(typeof loginResponse.body.accessToken).toBe('string');
      expect(loginResponse.body).toHaveProperty('user');
      expect(loginResponse.body.user).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          email: userCredentials.email,
        }),
      );

      const userId = loginResponse.body.user.id as string;
      const getResponse = await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);

      expect(getResponse.body).toEqual(
        expect.objectContaining({
          id: userId,
          fullName: userCredentials.fullName,
          email: userCredentials.email,
        }),
      );
    });
  });

  describe('Families', () => {
    it('creates a family and returns typed DTOs for queries', async () => {
      const userData = {
        fullName: 'Family Owner',
        email: 'family.owner@example.com',
        password: 'password123',
      };

      await request(app.getHttpServer()).post('/users/register').send(userData).expect(201);
      await waitForProjection();

      const loginResponse = await request(app.getHttpServer())
        .post('/users/login')
        .send({ email: userData.email, password: userData.password })
        .expect(201);

      const token = loginResponse.body.accessToken as string;
      const userId = loginResponse.body.user.id as string;

      await request(app.getHttpServer())
        .post('/families')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Family DTO', role: 'PRINCIPAL_RESPONSIBLE' })
        .expect(201);

      await waitForProjection();

      const response = await request(app.getHttpServer())
        .get(`/families/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const family: FamilyReadDto = response.body[0];
      expect(family).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Family DTO',
          members: expect.arrayContaining([
            expect.objectContaining({
              userId,
              memberName: expect.any(String),
            }),
          ]),
        }),
      );
    });
  });
});
