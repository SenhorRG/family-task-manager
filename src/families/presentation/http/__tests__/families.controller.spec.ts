import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FamiliesController } from '../families.controller';

import {
  CreateFamilyCommand,
  AddMemberCommand,
  RemoveMemberCommand,
  ChangeMemberRoleCommand,
  GetFamilyByIdQuery,
  GetFamiliesByUserQuery,
} from '../../../application';
import { FamilyRole, FamilyResponsibility, FamilyId } from '../../../domain';
import { randomBytes } from 'crypto';
import { UserId } from '../../../../users';
import { JwtAuthGuard } from '../../../../shared';

const makeObjectId = () => randomBytes(12).toString('hex');

const mockJwtAuthGuard = {
  canActivate: jest.fn(() => true),
};

jest.mock('../../../../shared/infrastructure/auth', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => mockJwtAuthGuard),
}));

describe('FamiliesController', () => {
  let controller: FamiliesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    const mockCommandBus = {
      execute: jest.fn(),
    };

    const mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamiliesController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<FamiliesController>(FamiliesController);
    commandBus = module.get(CommandBus);
    queryBus = module.get(QueryBus);
  });

  describe('createFamily', () => {
    it('it should create a family with success', async () => {
      const createFamilyDto = {
        name: 'Silva Family',
        role: FamilyRole.FATHER,
      };
      const userId = new UserId(makeObjectId());
      const req = {
        user: { sub: userId.value },
      };

      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.createFamily(createFamilyDto, req);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateFamilyCommand('Silva Family', userId.value, FamilyRole.FATHER),
      );
      expect(result).toEqual({ message: 'Family created successfully' });
    });

    it('it should throw command bus error', async () => {
      const createFamilyDto = {
        name: 'Silva Family',
        role: FamilyRole.FATHER,
      };
      const userId = new UserId(makeObjectId());
      const req = {
        user: { sub: userId.value },
      };

      const error = new Error('User already has a family');
      commandBus.execute.mockRejectedValue(error);

      await expect(controller.createFamily(createFamilyDto, req)).rejects.toThrow(error);
    });
  });

  describe('addMember', () => {
    it('it should add a member with success', async () => {
      const userId = new UserId(makeObjectId());
      const userToAdd = new UserId(makeObjectId());
      const familyId = new FamilyId(makeObjectId());

      const addMemberDto = {
        familyId: familyId.value,
        userId: userToAdd.value,
        role: FamilyRole.SON,
        responsibility: FamilyResponsibility.MEMBER,
      };
      const req = {
        user: { sub: userId.value },
      };

      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.addMember(addMemberDto, req);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new AddMemberCommand(
          familyId.value,
          userToAdd.value,
          FamilyRole.SON,
          FamilyResponsibility.MEMBER,
          userId.value,
        ),
      );
      expect(result).toEqual({ message: 'Member added successfully' });
    });

    it('it should throw command bus error', async () => {
      const userId = new UserId(makeObjectId());
      const userToAdd = new UserId(makeObjectId());
      const familyId = new FamilyId(makeObjectId());

      const addMemberDto = {
        familyId: familyId.value,
        userId: userToAdd.value,
        role: FamilyRole.SON,
        responsibility: FamilyResponsibility.MEMBER,
      };
      const req = {
        user: { sub: userId.value },
      };

      const error = new Error('User does not have permission');
      commandBus.execute.mockRejectedValue(error);

      await expect(controller.addMember(addMemberDto, req)).rejects.toThrow(error);
    });
  });

  describe('removeMember', () => {
    it('it should remove a member with success', async () => {
      const userId = new UserId(makeObjectId());
      const userToRemove = new UserId(makeObjectId());
      const familyId = new FamilyId(makeObjectId());
      const req = {
        user: { sub: userId.value },
      };

      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.removeMember(familyId.value, userToRemove.value, req);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new RemoveMemberCommand(familyId.value, userToRemove.value, userId.value),
      );
      expect(result).toEqual({ message: 'Member removed successfully' });
    });

    it('it should throw command bus error', async () => {
      const userId = new UserId(makeObjectId());
      const userToRemove = new UserId(makeObjectId());
      const familyId = new FamilyId(makeObjectId());
      const req = {
        user: { sub: userId.value },
      };

      const error = new Error('Member not found');
      commandBus.execute.mockRejectedValue(error);

      await expect(
        controller.removeMember(familyId.value, userToRemove.value, req),
      ).rejects.toThrow(error);
    });
  });

  describe('changeMemberRole', () => {
    it('it should change member role with success', async () => {
      const userId = new UserId(makeObjectId());
      const userToChangeRole = new UserId(makeObjectId());
      const familyId = new FamilyId(makeObjectId());

      const changeRoleDto = {
        familyId: familyId.value,
        userId: userToChangeRole.value,
        newRole: FamilyRole.FATHER,
        newResponsibility: FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      };
      const req = {
        user: { sub: userId.value },
      };

      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.changeMemberRole(changeRoleDto, req);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new ChangeMemberRoleCommand(
          familyId.value,
          userToChangeRole.value,
          FamilyRole.FATHER,
          FamilyResponsibility.AUXILIARY_RESPONSIBLE,
          userId.value,
        ),
      );
      expect(result).toEqual({ message: 'Role changed successfully' });
    });

    it('it should throw command bus error', async () => {
      const userId = new UserId(makeObjectId());
      const userToChangeRole = new UserId(makeObjectId());
      const familyId = new FamilyId(makeObjectId());
      const changeRoleDto = {
        familyId: familyId.value,
        userId: userToChangeRole.value,
        newRole: FamilyRole.FATHER,
        newResponsibility: FamilyResponsibility.AUXILIARY_RESPONSIBLE,
      };
      const req = {
        user: { sub: userId.value },
      };

      const error = new Error('User does not have permission');
      commandBus.execute.mockRejectedValue(error);

      await expect(controller.changeMemberRole(changeRoleDto, req)).rejects.toThrow(error);
    });
  });

  describe('getFamilyById', () => {
    it('it should return family by id', async () => {
      const familyId = new FamilyId(makeObjectId());
      const mockFamily = {
        id: familyId.value,
        name: 'Silva Family',
        members: [
          {
            userId: makeObjectId(),
            role: 'FATHER',
            responsibility: 'PRINCIPAL_RESPONSIBLE',
          },
          {
            userId: makeObjectId(),
            role: 'MOTHER',
            responsibility: 'AUXILIARY_RESPONSIBLE',
          },
          {
            userId: makeObjectId(),
            role: 'SON',
            responsibility: 'MEMBER',
          },
        ],
      };

      queryBus.execute.mockResolvedValue(mockFamily);

      const result = await controller.getFamilyById(familyId.value);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetFamilyByIdQuery(familyId.value));
      expect(result).toEqual(mockFamily);
      expect(result.members).toHaveLength(3);
    });

    it('it should throw command bus error', async () => {
      const familyId = new FamilyId(makeObjectId());
      const error = new Error('Family not found');
      queryBus.execute.mockRejectedValue(error);

      await expect(controller.getFamilyById(familyId.value)).rejects.toThrow(error);
    });
  });

  describe('getFamiliesByUser', () => {
    it('it should return families by userId', async () => {
      const userId = new UserId(makeObjectId());
      const familyId1 = new FamilyId(makeObjectId());
      const familyId2 = new FamilyId(makeObjectId());
      const mockFamilies = [
        {
          id: familyId1.value,
          name: 'Silva Family',
          role: 'FATHER',
          responsibility: 'PRINCIPAL_RESPONSIBLE',
        },
        {
          id: familyId2.value,
          name: 'Santos Family',
          role: 'MEMBER',
          responsibility: 'MEMBER',
        },
      ];

      queryBus.execute.mockResolvedValue(mockFamilies);

      const result = await controller.getFamiliesByUser(userId.value);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetFamiliesByUserQuery(userId.value));
      expect(result).toEqual(mockFamilies);
    });

    it('it should return an empty array when no families are found', async () => {
      const userId = new UserId(makeObjectId());
      queryBus.execute.mockResolvedValue([]);

      const result = await controller.getFamiliesByUser(userId.value);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetFamiliesByUserQuery(userId.value));
      expect(result).toEqual([]);
    });

    it('it should throw command bus error', async () => {
      const userId = new UserId(makeObjectId());
      const error = new Error('Database connection failed');
      queryBus.execute.mockRejectedValue(error);

      await expect(controller.getFamiliesByUser(userId.value)).rejects.toThrow(error);
    });
  });
});
