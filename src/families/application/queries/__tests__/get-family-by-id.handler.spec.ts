import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetFamilyByIdHandler, GetFamilyByIdQuery } from '../get-family-by-id';
import { FamilyReadRepository } from '../../ports';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('GetFamilyByIdHandler', () => {
  let handler: GetFamilyByIdHandler;
  let familyReadRepository: jest.Mocked<FamilyReadRepository>;

  beforeEach(async () => {
    const mockFamilyReadRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetFamilyByIdHandler,
        {
          provide: 'FamilyReadRepository',
          useValue: mockFamilyReadRepository,
        },
      ],
    }).compile();

    handler = module.get<GetFamilyByIdHandler>(GetFamilyByIdHandler);
    familyReadRepository = module.get('FamilyReadRepository');
  });

  describe('execute', () => {
    it('it should return a family when found', async () => {
      const familyId = makeObjectId();
      const query = new GetFamilyByIdQuery(familyId);

      const mockFamily = {
        id: familyId,
        name: 'Silva Family',
        members: [
          {
            userId: makeObjectId(),
            role: 'FATHER',
            responsibility: 'PRINCIPAL_RESPONSIBLE',
          },
        ],
      };

      familyReadRepository.findById.mockResolvedValue(mockFamily);

      const result = await handler.execute(query);

      expect(result).toEqual(mockFamily);
      expect(familyReadRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
    });

    it('it should throw a not found exception when the family is not found', async () => {
      const familyId = makeObjectId();
      const query = new GetFamilyByIdQuery(familyId);

      familyReadRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);

      expect(familyReadRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
    });
  });
});
