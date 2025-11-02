import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventBus } from '@nestjs/cqrs';
import { MongoFamilyRepository } from '../mongoose/repositories';
import { FamilyId, FamilyRole, FamilyResponsibility } from '../../../domain';
import { UserId } from '../../../../users';
import { EventStore } from '../../../../shared';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');

describe('MongoFamilyRepository', () => {
  let repository: MongoFamilyRepository;
  let writeModel: jest.Mocked<Model<any>>;
  let eventStore: jest.Mocked<EventStore>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    const mockWriteModel = {
      findByIdAndUpdate: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const mockEventStore = {
      saveEvents: jest.fn(),
      getEvents: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoFamilyRepository,
        {
          provide: getModelToken('FamilySchema', 'writeConnection'),
          useValue: mockWriteModel,
        },
        {
          provide: 'EventStore',
          useValue: mockEventStore,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    repository = module.get<MongoFamilyRepository>(MongoFamilyRepository);
    writeModel = module.get(getModelToken('FamilySchema', 'writeConnection'));
    eventStore = module.get('EventStore');
    eventBus = module.get(EventBus);
  });

  describe('save', () => {
    it('it should save a family', async () => {
      const familyId = new FamilyId(makeObjectId());
      const userId = new UserId(makeObjectId());

      const mockFamily = {
        familyId: { value: familyId.value },
        name: { value: 'Silva Family' },
        members: [
          {
            userId: { value: userId.value },
            role: { value: FamilyRole.FATHER },
            responsibility: { value: FamilyResponsibility.PRINCIPAL_RESPONSIBLE },
            joinedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        uncommittedEvents: [],
        version: 1,
        markEventsAsCommitted: jest.fn(),
      } as any;

      const savedDocument = {
        _id: familyId.value,
        name: 'Silva Family',
        members: [
          {
            userId: userId.value,
            role: 'FATHER',
            responsibility: 'PRINCIPAL_RESPONSIBLE',
            joinedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      writeModel.findByIdAndUpdate.mockResolvedValue(savedDocument);

      await repository.save(mockFamily);

      expect(writeModel.findByIdAndUpdate).toHaveBeenCalledWith(
        familyId.value,
        {
          _id: familyId.value,
          name: 'Silva Family',
          members: [
            {
              userId: userId.value,
              role: 'FATHER',
              responsibility: 'PRINCIPAL_RESPONSIBLE',
              joinedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          upsert: true,
          new: true,
        },
      );
    });

    it('it should save a family when it has uncommitted events', async () => {
      const familyId = new FamilyId(makeObjectId());

      const mockEvent = {
        aggregateId: familyId.value,
        eventType: 'FamilyCreatedEvent',
      };

      const mockFamily = {
        familyId: { value: familyId.value },
        name: { value: 'Silva Family' },
        members: [],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        uncommittedEvents: [mockEvent],
        version: 2,
        markEventsAsCommitted: jest.fn(),
      } as any;

      writeModel.findByIdAndUpdate.mockResolvedValue({});
      eventStore.saveEvents.mockResolvedValue(undefined);
      eventBus.publish.mockResolvedValue(undefined);

      await repository.save(mockFamily);

      expect(eventStore.saveEvents).toHaveBeenCalledWith(
        familyId.value,
        [mockEvent],
        1,
      );
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvent);
      expect(mockFamily.markEventsAsCommitted).toHaveBeenCalled();
    });

    it('it should throw an error when save on MongoDB fails', async () => {
      const mockFamily = {
        familyId: { value: makeObjectId() },
        name: { value: 'Silva Family' },
        members: [],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        uncommittedEvents: [],
        version: 1,
        markEventsAsCommitted: jest.fn(),
      } as any;

      const mongoError = new Error('MongoDB connection failed');
      writeModel.findByIdAndUpdate.mockRejectedValue(mongoError);

      await expect(repository.save(mockFamily)).rejects.toThrow(mongoError);
    });
  });

  describe('findById', () => {
    it('it should return a family when found', async () => {
      const familyId = new FamilyId(makeObjectId());
      const mockDocument = {
        _id: familyId.value,
        name: 'Silva Family',
        members: [
          {
            userId: makeObjectId(),
            role: 'FATHER',
            responsibility: 'PRINCIPAL_RESPONSIBLE',
            joinedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      writeModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await repository.findById(familyId);

      expect(writeModel.findById).toHaveBeenCalledWith(familyId.value);
      expect(result).toBeDefined();
      expect(result?.familyId.value).toBe(familyId.value);
      expect(result?.name.value).toBe('Silva Family');
    });

    it('it should return null when a family is not found', async () => {
      const familyId = new FamilyId(makeObjectId());
      writeModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await repository.findById(familyId);

      expect(writeModel.findById).toHaveBeenCalledWith(familyId.value);
      expect(result).toBeNull();
    });

    it('it should throw an error when MongoDB findById   fails', async () => {
      const familyId = new FamilyId(makeObjectId());
      const mongoError = new Error('MongoDB connection failed');
      writeModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(mongoError),
      } as any);

      await expect(repository.findById(familyId)).rejects.toThrow(mongoError);
    });
  });

  describe('findByPrincipalResponsible', () => {
    it('it should return a family when responsible principal is found', async () => {
      const userId = new UserId(makeObjectId());
      const familyId = new FamilyId(makeObjectId());

      const mockDocument = {
        _id: familyId.value,
        name: 'Silva Family',
        members: [
          {
            userId: userId.value,
            role: 'FATHER',
            responsibility: 'PRINCIPAL_RESPONSIBLE',
            joinedAt: new Date('2024-01-01T00:00:00.000Z'),
          },
        ],
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      writeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument),
      } as any);

      const result = await repository.findByPrincipalResponsible(userId);

      expect(writeModel.findOne).toHaveBeenCalledWith({
        'members.userId': userId.value,
        'members.responsibility': 'PRINCIPAL_RESPONSIBLE',
      });
      expect(result).toBeDefined();
      expect(result?.familyId.value).toBe(familyId.value);
    });

    it('it should return null when responsible principal is not found', async () => {
      const userId = new UserId(makeObjectId());

      writeModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await repository.findByPrincipalResponsible(userId);

      expect(writeModel.findOne).toHaveBeenCalledWith({
        'members.userId': userId.value,
        'members.responsibility': 'PRINCIPAL_RESPONSIBLE',
      });
      expect(result).toBeNull();
    });
  });

  describe('findByMember', () => {
    it('it should return families when member is found', async () => {
      const userId = new UserId(makeObjectId());
      const familyId1 = new FamilyId(makeObjectId());
      const familyId2 = new FamilyId(makeObjectId());

      const mockDocuments = [
        {
          _id: familyId1.value,
          name: 'Silva Family',
          members: [
            {
              userId: userId.value,
              role: 'FATHER',
              responsibility: 'PRINCIPAL_RESPONSIBLE',
              joinedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          _id: familyId2.value,
          name: 'Santos Family',
          members: [
            {
              userId: userId.value,
              role: 'MEMBER',
              responsibility: 'MEMBER',
              joinedAt: new Date('2024-02-01T00:00:00.000Z'),
            },
          ],
          createdAt: new Date('2024-02-01T00:00:00.000Z'),
          updatedAt: new Date('2024-02-01T00:00:00.000Z'),
        },
      ];

      writeModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocuments),
      } as any);

      const result = await repository.findByMember(userId);

      expect(writeModel.find).toHaveBeenCalledWith({
        'members.userId': userId.value,
      });
      expect(result).toHaveLength(2);
      expect(result[0].familyId.value).toBe(familyId1.value);
      expect(result[1].familyId.value).toBe(familyId2.value);
    });

    it('it should return an empty array when member is not found', async () => {
      const userId = new UserId(makeObjectId());
      writeModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await repository.findByMember(userId);

      expect(writeModel.find).toHaveBeenCalledWith({
        'members.userId': userId.value,
      });
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('it should delete a family with success', async () => {
      const familyId = new FamilyId(makeObjectId());
      writeModel.findByIdAndDelete.mockResolvedValue({});

      await repository.delete(familyId);

      expect(writeModel.findByIdAndDelete).toHaveBeenCalledWith(familyId.value);
    });

    it('it should throw an error when delete on MongoDB fails', async () => {
      const familyId = new FamilyId(makeObjectId());
      const mongoError = new Error('MongoDB connection failed');
      writeModel.findByIdAndDelete.mockRejectedValue(mongoError);

      await expect(repository.delete(familyId)).rejects.toThrow(mongoError);
    });
  });
});
