import { Test, TestingModule } from '@nestjs/testing';
import { GetFamiliesByUserHandler, GetFamiliesByUserQuery } from '../get-families-by-user';
import { FamilyReadRepository } from '../../ports';
import { randomBytes } from 'crypto';
import { NotFoundException } from '@nestjs/common';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('GetFamiliesByUserHandler', () => {
  let handler: GetFamiliesByUserHandler;
  let familyReadRepository: jest.Mocked<FamilyReadRepository>;

  beforeEach(async () => {
    const mockFamilyReadRepository = {
      findByMember: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFamiliesByUserHandler,
        {
          provide: 'FamilyReadRepository',
          useValue: mockFamilyReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetFamiliesByUserHandler>(GetFamiliesByUserHandler);
    familyReadRepository = module.get('FamilyReadRepository');
  });

  describe('execute', () => {
    it('it should return families when found', async () => {
      const userId = makeObjectId();
      const query = new GetFamiliesByUserQuery(userId);
      const mockFamilies = [
        {
          id: makeObjectId(),
          name: 'Silva Family',
          role: 'FATHER',
          responsibility: 'PRINCIPAL_RESPONSIBLE',
          joinedAt: new Date('2024-01-01T00:00:00.000Z'),
        },
        {
          id: makeObjectId(),
          name: 'Santos Family',
          role: 'MEMBER',
          responsibility: 'MEMBER',
          joinedAt: new Date('2024-02-01T00:00:00.000Z'),
        },
      ];

      familyReadRepository.findByMember.mockResolvedValue(mockFamilies);

      const result = await handler.execute(query);

      expect(result).toEqual(mockFamilies);
      expect(familyReadRepository.findByMember).toHaveBeenCalledWith(
        expect.objectContaining({ value: userId }),
      );
      expect(result).toHaveLength(mockFamilies.length);
    });

    it('it should return an empty array when the user has no families', async () => {
      const userId = makeObjectId();
      const query = new GetFamiliesByUserQuery(userId);

      familyReadRepository.findByMember.mockResolvedValue([]);

      const result = await handler.execute(query);

      expect(familyReadRepository.findByMember).toHaveBeenCalledWith(
        expect.objectContaining({
          value: userId,
        }),
      );
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('it should throw a not found exception when the user is not found', async () => {
      const userId = makeObjectId();
      const query = new GetFamiliesByUserQuery(userId);

      familyReadRepository.findByMember.mockRejectedValue(new NotFoundException('User not found'));

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);

      expect(familyReadRepository.findByMember).toHaveBeenCalledWith(
        expect.objectContaining({ value: userId }),
      );
    });
  });
});
