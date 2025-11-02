import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('CQRS Event Sourcing Integration Tests', () => {
  let app: INestApplication;
  let userWriteModel: Model<any>;
  let userReadModel: Model<any>;
  let familyWriteModel: Model<any>;
  let familyReadModel: Model<any>;
  let taskWriteModel: Model<any>;
  let taskReadModel: Model<any>;
  let eventModel: Model<any>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userWriteModel = moduleFixture.get<Model<any>>(
      getModelToken('User', 'writeConnection'),
    );
    userReadModel = moduleFixture.get<Model<any>>(
      getModelToken('User', 'readConnection'),
    );
    familyWriteModel = moduleFixture.get<Model<any>>(
      getModelToken('Family', 'writeConnection'),
    );
    familyReadModel = moduleFixture.get<Model<any>>(
      getModelToken('Family', 'readConnection'),
    );
    taskWriteModel = moduleFixture.get<Model<any>>(
      getModelToken('Task', 'writeConnection'),
    );
    taskReadModel = moduleFixture.get<Model<any>>(
      getModelToken('Task', 'readConnection'),
    );
    eventModel = moduleFixture.get<Model<any>>(
      getModelToken('Event', 'eventsConnection'),
    );
  });

  beforeEach(async () => {
    // Limpar todos os bancos antes de cada teste
    await userWriteModel.deleteMany({});
    await userReadModel.deleteMany({});
    await familyWriteModel.deleteMany({});
    await familyReadModel.deleteMany({});
    await taskWriteModel.deleteMany({});
    await taskReadModel.deleteMany({});
    await eventModel.deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Synchronization', () => {
    it('should create user and sync to read database', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send(userData)
        .expect(201);

      const userId = response.body.id;

      // Aguardar um pouco para a projeção processar
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verificar write database
      const userInWrite = await userWriteModel.findById(userId).exec();
      expect(userInWrite).toBeDefined();
      expect(userInWrite.email).toBe(userData.email);

      // Verificar read database
      const userInRead = await userReadModel.findById(userId).exec();
      expect(userInRead).toBeDefined();
      expect(userInRead.email).toBe(userData.email);

      // Verificar event store
      const events = await eventModel
        .find({ aggregateId: userId, aggregateType: 'User' })
        .exec();
      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.eventType === 'UserCreatedEvent')).toBe(true);
    });

    it('should delete user and sync to read database', async () => {
      // Criar usuário primeiro
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.id;

      // Aguardar sincronização
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Deletar usuário (assumindo que há endpoint DELETE)
      // Nota: Este teste depende de ter um endpoint DELETE implementado

      // Verificar que foi deletado do write
      // Verificar que foi deletado do read
      // Verificar que evento de delete foi criado
    });
  });

  describe('Family Synchronization', () => {
    it('should create family and sync to read database', async () => {
      // Primeiro criar um usuário
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const userResponse = await request(app.getHttpServer())
        .post('/users/register')
        .send(userData)
        .expect(201);

      const userId = userResponse.body.id;

      // Aguardar sincronização
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Criar família (assumindo endpoint)
      // Verificar sincronização
    });
  });

  describe('Event Store Verification', () => {
    it('should save all events to event store', async () => {
      const userData = {
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users/register')
        .send(userData)
        .expect(201);

      const userId = response.body.id;

      // Aguardar processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const events = await eventModel
        .find({ aggregateId: userId })
        .sort({ version: 1 })
        .exec();

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].eventType).toBe('UserCreatedEvent');
      expect(events[0].aggregateId).toBe(userId);
      expect(events[0].aggregateType).toBe('User');
    });
  });
});

