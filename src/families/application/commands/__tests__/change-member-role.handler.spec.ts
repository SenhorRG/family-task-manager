import { Test, TestingModule } from '@nestjs/testing';
import { ChangeMemberRoleHandler, ChangeMemberRoleCommand } from '../change-member-role';
import { FamilyRepository, Family, FamilyRole, FamilyResponsibility } from '../../../domain';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');

describe('ChangeMemberRoleHandler', () => {
  let handler: ChangeMemberRoleHandler;
  let familyRepository: jest.Mocked<FamilyRepository>;

  beforeEach(async () => {
    const mockFamilyRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeMemberRoleHandler,
        {
          provide: 'FamilyRepository',
          useValue: mockFamilyRepository,
        },
      ],
    }).compile();

    handler = module.get<ChangeMemberRoleHandler>(ChangeMemberRoleHandler);
    familyRepository = module.get('FamilyRepository');
  });

  describe('execute', () => {
    it('it should change the member role with success', async () => {
      const familyId = makeObjectId();
      const userId = makeObjectId();
      const addedById = makeObjectId();
      const command = new ChangeMemberRoleCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      const mockFamily = {
        changeMemberRole: jest.fn(),
      } as unknown as jest.Mocked<Family>;

      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );

      expect(mockFamily.changeMemberRole).toHaveBeenCalledWith(
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
      const command = new ChangeMemberRoleCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      familyRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow('Family not found');

      expect(familyRepository.findById).toHaveBeenCalledWith(
        expect.objectContaining({ value: familyId }),
      );
      expect(familyRepository.save).not.toHaveBeenCalled();
    });

    it('it should throw an error when changeMemberRole fails', async () => {
      const familyId = makeObjectId();
      const userId = makeObjectId();
      const addedById = makeObjectId();
      const command = new ChangeMemberRoleCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      const mockFamily = {
        changeMemberRole: jest.fn().mockImplementation(() => {
          throw new Error('Change member role failed');
        }),
      } as unknown as jest.Mocked<Family>;

      familyRepository.findById.mockResolvedValue(mockFamily);

      await expect(handler.execute(command)).rejects.toThrow('Change member role failed');
    });

    it('it should throw an error when save fails', async () => {
      const familyId = makeObjectId();
      const userId = makeObjectId();
      const addedById = makeObjectId();
      const command = new ChangeMemberRoleCommand(
        familyId,
        userId,
        FamilyRole.SON,
        FamilyResponsibility.MEMBER,
        addedById,
      );

      const mockFamily = {
        changeMemberRole: jest.fn(),
      } as unknown as jest.Mocked<Family>;

      const saveError = new Error('Save failed');
      familyRepository.findById.mockResolvedValue(mockFamily);
      familyRepository.save.mockRejectedValue(saveError);

      await expect(handler.execute(command)).rejects.toThrow('Save failed');
      expect(mockFamily.changeMemberRole).toHaveBeenCalled();
    });
  });
});
