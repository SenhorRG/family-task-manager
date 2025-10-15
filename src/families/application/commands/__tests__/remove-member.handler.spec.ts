import { Test, TestingModule } from '@nestjs/testing';
import { RemoveMemberHandler, RemoveMemberCommand } from '../remove-member';
import { Family, FamilyRepository } from '../../../domain';
import { NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('RemoveMemberHandler', () => {
  let handler: RemoveMemberHandler;
  let familyRepository: jest.Mocked<FamilyRepository>;

  beforeEach(async () => {
    const mockFamilyRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByPrincipalResponsible: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveMemberHandler,
        {
          provide: 'FamilyRepository',
          useValue: mockFamilyRepository,
        },
      ],
    }).compile();

    handler = module.get<RemoveMemberHandler>(RemoveMemberHandler);
    familyRepository = module.get('FamilyRepository');
  });

  describe('execute', () => {
    it('it should remove a member with success', async () => {
      const familyId = makeObjectId();
      const memberId = makeObjectId();
      const removedById = makeObjectId();

      const command = new RemoveMemberCommand(familyId, memberId, removedById);

      const mockFamily = { removeMember: jest.fn() } as unknown as jest.Mocked<Family>;
      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(mockFamily.removeMember).toHaveBeenCalledWith(
        expect.objectContaining({ value: memberId }),
        expect.objectContaining({ value: removedById }),
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });

    it('it should throw a error when the family is not found', async () => {
      const familyId = makeObjectId();
      const memberId = makeObjectId();
      const removedById = makeObjectId();

      const command = new RemoveMemberCommand(familyId, memberId, removedById);

      familyRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(familyRepository.save).not.toHaveBeenCalled();
    });

    it('it should throw a error when the repository save fails', async () => {
      const familyId = makeObjectId();
      const memberId = makeObjectId();
      const removedById = makeObjectId();

      const command = new RemoveMemberCommand(familyId, memberId, removedById);

      const mockFamily = { removeMember: jest.fn() } as unknown as jest.Mocked<Family>;
      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(handler.execute(command)).rejects.toThrow(Error);
      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(mockFamily.removeMember).toHaveBeenCalledWith(
        expect.objectContaining({ value: memberId }),
        expect.objectContaining({ value: removedById }),
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });

    it('it should throw a error when the repository findById fails', async () => {
      const familyId = makeObjectId();
      const memberId = makeObjectId();
      const removedById = makeObjectId();

      const command = new RemoveMemberCommand(familyId, memberId, removedById);

      const repositoryError = new Error('Database connection failed');
      familyRepository.findById.mockRejectedValue(repositoryError);

      await expect(handler.execute(command)).rejects.toThrow(repositoryError);
      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(familyRepository.save).not.toHaveBeenCalled();
    });

    it('it should remove a member when the removedById is different from the memberId', async () => {
      const familyId = makeObjectId();
      const memberId = makeObjectId();
      const removedById = makeObjectId();

      const command = new RemoveMemberCommand(familyId, memberId, removedById);

      const mockFamily = { removeMember: jest.fn() } as unknown as jest.Mocked<Family>;
      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(mockFamily.removeMember).toHaveBeenCalledWith(
        expect.objectContaining({ value: memberId }),
        expect.objectContaining({ value: removedById }),
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });

    it('it should remove a member when the removedById is the same as the memberId', async () => {
      const familyId = makeObjectId();
      const memberId = makeObjectId();
      const removedById = memberId;

      const command = new RemoveMemberCommand(familyId, memberId, removedById);

      const mockFamily = { removeMember: jest.fn() } as unknown as jest.Mocked<Family>;
      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(mockFamily.removeMember).toHaveBeenCalledWith(
        expect.objectContaining({ value: memberId }),
        expect.objectContaining({ value: removedById }),
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });
  });
});
