import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryBus } from '@nestjs/cqrs';
import { MongoFamilyReadRepository } from '../mongoose/repositories';
import { FamilyId } from '../../../domain';
import { UserId, GetUsersInfoQuery } from '../../../../users';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');

describe('MongoFamilyReadRepository', () => {
  let repository: MongoFamilyReadRepository;
  let readModel: jest.Mocked<Model<any>>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockReadModel = {
      findById: jest.fn(),
      find: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoFamilyReadRepository,
        {
          provide: getModelToken('FamilySchema', 'readConnection'),
          useValue: mockReadModel,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    repository = module.get<MongoFamilyReadRepository>(MongoFamilyReadRepository);
    readModel = module.get(getModelToken('FamilySchema', 'readConnection'));
    queryBus = module.get(QueryBus);
  });

  describe('findById', () => {
    it('it should return family when found', async () => {
      const familyId = new FamilyId(makeObjectId());
      const userId = new UserId(makeObjectId());
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

      const mockUsersInfo = new Map([[userId.value, { fullName: 'João Silva' }]]);

      readModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument),
      } as any);
      queryBus.execute.mockResolvedValue(mockUsersInfo);

      const result = await repository.findById(familyId);

      expect(readModel.findById).toHaveBeenCalledWith(familyId.value);
      expect(queryBus.execute).toHaveBeenCalledWith(new GetUsersInfoQuery([userId.value]));
      expect(result).toBeDefined();
      expect(result?.id).toBe(familyId.value);
      expect(result?.name).toBe('Silva Family');
      expect(result?.members[0].memberName).toBe('João Silva');
    });

    it('it should return null when family is not found', async () => {
      const familyId = new FamilyId(makeObjectId());
      readModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await repository.findById(familyId);

      expect(readModel.findById).toHaveBeenCalledWith(familyId.value);
      expect(result).toBeNull();
      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('it should uses a default name when user is not found', async () => {
      const familyId = new FamilyId(makeObjectId());
      const userId = new UserId(makeObjectId());
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

      const mockUsersInfo = new Map();

      readModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocument),
      } as any);
      queryBus.execute.mockResolvedValue(mockUsersInfo);

      const result = await repository.findById(familyId);

      expect(result?.members[0].memberName).toBe('User not found');
    });

    it('it should throw an error when findById from MongoDB fails', async () => {
      const familyId = new FamilyId(makeObjectId());
      const mongoError = new Error('MongoDB connection failed');
      readModel.findById.mockReturnValue({
        exec: jest.fn().mockRejectedValue(mongoError),
      } as any);

      await expect(repository.findById(familyId)).rejects.toThrow(mongoError);
    });
  });

  describe('findByMember', () => {
    it('it should return families when found', async () => {
      const userId = new UserId(makeObjectId());
      const FamilyId1 = new FamilyId(makeObjectId());
      const FamilyId2 = new FamilyId(makeObjectId());
      const mockDocuments = [
        {
          _id: FamilyId1.value,
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
          _id: FamilyId2.value,
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

      const mockUsersInfo = new Map([[userId.value, { fullName: 'João Silva' }]]);

      readModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocuments),
      } as any);
      queryBus.execute.mockResolvedValue(mockUsersInfo);

      const result = await repository.findByMember(userId);

      expect(readModel.find).toHaveBeenCalledWith({
        'members.userId': userId.value,
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(FamilyId1.value);
      expect(result[1].id).toBe(FamilyId2.value);
      expect(result[0].members[0].memberName).toBe('João Silva');
      expect(result[1].members[0].memberName).toBe('João Silva');
    });

    it('it should return an empty array when member is not found', async () => {
      const userId = new UserId(makeObjectId());
      readModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await repository.findByMember(userId);

      expect(readModel.find).toHaveBeenCalledWith({
        'members.userId': userId.value,
      });
      expect(result).toEqual([]);
      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('it should throw an error when find from MongoDB fails', async () => {
      const userId = new UserId(makeObjectId());
      const mongoError = new Error('MongoDB connection failed');
      readModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(mongoError),
      } as any);

      await expect(repository.findByMember(userId)).rejects.toThrow(mongoError);
    });
  });

  describe('findAll', () => {
    it('it should return all families when found', async () => {
      const userId1 = new UserId(makeObjectId());
      const userId2 = new UserId(makeObjectId());
      const FamilyId1 = new FamilyId(makeObjectId());
      const FamilyId2 = new FamilyId(makeObjectId());
      const mockDocuments = [
        {
          _id: FamilyId1.value,
          name: 'Silva Family',
          members: [
            {
              userId: userId1.value,
              role: 'FATHER',
              responsibility: 'PRINCIPAL_RESPONSIBLE',
              joinedAt: new Date('2024-01-01T00:00:00.000Z'),
            },
          ],
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          _id: FamilyId2.value,
          name: 'Santos Family',
          members: [
            {
              userId: userId2.value,
              role: 'MOTHER',
              responsibility: 'PRINCIPAL_RESPONSIBLE',
              joinedAt: new Date('2024-02-01T00:00:00.000Z'),
            },
          ],
          createdAt: new Date('2024-02-01T00:00:00.000Z'),
          updatedAt: new Date('2024-02-01T00:00:00.000Z'),
        },
      ];

      const mockUsersInfo = new Map([
        [userId1.value, { fullName: 'João Silva' }],
        [userId2.value, { fullName: 'Maria Santos' }],
      ]);

      readModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDocuments),
      } as any);
      queryBus.execute.mockResolvedValue(mockUsersInfo);

      const result = await repository.findAll();

      expect(readModel.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(FamilyId1.value);
      expect(result[1].id).toBe(FamilyId2.value);
      expect(result[0].members[0].memberName).toBe('João Silva');
      expect(result[1].members[0].memberName).toBe('Maria Santos');
    });

    it('it should return an empty array when no families are found', async () => {
      readModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await repository.findAll();

      expect(readModel.find).toHaveBeenCalledWith();
      expect(result).toEqual([]);
      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('it should throw an error when find from MongoDB fails', async () => {
      const mongoError = new Error('MongoDB connection failed');
      readModel.find.mockReturnValue({
        exec: jest.fn().mockRejectedValue(mongoError),
      } as any);

      await expect(repository.findAll()).rejects.toThrow(mongoError);
    });
  });
});
