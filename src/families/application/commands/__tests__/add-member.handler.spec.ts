import { AddMemberCommand, AddMemberHandler } from '../add-member';
import { Test, TestingModule } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import { Family, FamilyRepository, FamilyResponsibility, FamilyRole } from '../../../domain';
import { NotFoundException } from '@nestjs/common';

const makeObjectId = () => randomBytes(12).toString('hex');

describe('AddMemberHandler', () => {
  let handler: AddMemberHandler;
  let familyRepository: jest.Mocked<FamilyRepository>;

  beforeEach(async () => {
    const mockFamilyRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddMemberHandler,
        { provide: 'FamilyRepository', useValue: mockFamilyRepository },
      ],
    }).compile();

    handler = module.get<AddMemberHandler>(AddMemberHandler);
    familyRepository = module.get('FamilyRepository');
  });

  describe('execute', () => {
    it('it should add a member to the family', async () => {
      const familyId = makeObjectId();
      const userId = makeObjectId();
      const addedById = makeObjectId();
      const command = new AddMemberCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      const mockFamily = {
        addMember: jest.fn(),
      } as unknown as jest.Mocked<Family>;

      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(mockFamily.addMember).toHaveBeenCalledTimes(1);
      expect(mockFamily.addMember).toHaveBeenCalledWith(
        expect.objectContaining({ value: userId }),
        expect.objectContaining({ value: FamilyRole.SON }),
        expect.objectContaining({ value: FamilyResponsibility.MEMBER }),
        expect.objectContaining({ value: addedById }),
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });

    it('it should throw NotFoundException when family is not found', async () => {
      const familyId = makeObjectId();
      const userId = makeObjectId();
      const addedById = makeObjectId();
      const command = new AddMemberCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      familyRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);

      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(familyRepository.save).not.toHaveBeenCalled();
    });

    it('it should throw an error when addMember fails', async () => {
      const familyId = makeObjectId();
      const userId = makeObjectId();
      const addedById = makeObjectId();
      const command = new AddMemberCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      const mockFamily = {
        addMember: jest.fn().mockImplementation(() => {
          throw new Error('User is already a member of the family');
        }),
      } as unknown as jest.Mocked<Family>;

      familyRepository.findById.mockResolvedValue(mockFamily);

      await expect(handler.execute(command)).rejects.toThrow(
        'User is already a member of the family',
      );
      expect(familyRepository.save).not.toHaveBeenCalled();
    });

    it('it should throw an error when save fails', async () => {
      const familyId = makeObjectId();
      const userId = makeObjectId();
      const addedById = makeObjectId();
      const command = new AddMemberCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      const mockFamily = {
        addMember: jest.fn(),
      } as unknown as jest.Mocked<Family>;

      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(handler.execute(command)).rejects.toThrow('Save failed');

      expect(mockFamily.addMember).toHaveBeenCalled();
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });
  });
});
