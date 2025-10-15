import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { CreateFamilyHandler, CreateFamilyCommand } from '../create-family';
import { Family, FamilyRole, FamilyFactory, FamilyRepository } from '../../../domain';
import { UserId } from '../../../../users';
import { randomBytes } from 'crypto';

const makeObjectId = () => randomBytes(12).toString('hex');
describe('CreateFamilyHandler', () => {
  let handler: CreateFamilyHandler;
  let familyFactory: jest.Mocked<FamilyFactory>;
  let familyRepository: jest.Mocked<FamilyRepository>;

  beforeEach(async () => {
    const mockFamilyFactory = {
      createFamily: jest.fn(),
    };

    const mockFamilyRepository = {
      save: jest.fn(),
      findByPrincipalResponsible: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateFamilyHandler,
        {
          provide: FamilyFactory,
          useValue: mockFamilyFactory,
        },
        {
          provide: 'FamilyRepository',
          useValue: mockFamilyRepository,
        },
      ],
    }).compile();

    handler = module.get<CreateFamilyHandler>(CreateFamilyHandler);
    familyFactory = module.get(FamilyFactory);
    familyRepository = module.get('FamilyRepository');
  });

  describe('execute', () => {
    it('it should create a family when the user is not responsible of any family', async () => {
      const userId = makeObjectId();
      const command = new CreateFamilyCommand('Silva Family', userId, FamilyRole.FATHER);

      const mockFamily = {} as jest.Mocked<Family>;
      familyRepository.findByPrincipalResponsible.mockResolvedValue(null);
      familyFactory.createFamily.mockReturnValue(mockFamily);
      familyRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(familyRepository.findByPrincipalResponsible).toHaveBeenCalledWith(expect.any(UserId));
      expect(familyFactory.createFamily).toHaveBeenCalledWith(
        'Silva Family',
        userId,
        FamilyRole.FATHER,
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });

    it('it should throw a ConflictException when the user is already responsible of a family', async () => {
      const userId = makeObjectId();
      const command = new CreateFamilyCommand('Silva Family', userId, FamilyRole.FATHER);

      const mockFamily = {} as jest.Mocked<Family>;
      familyRepository.findByPrincipalResponsible.mockResolvedValue(mockFamily);

      await expect(handler.execute(command)).rejects.toThrow(
        new ConflictException('The user is already principal responsible of a family'),
      );

      expect(familyRepository.findByPrincipalResponsible).toHaveBeenCalledWith(expect.any(UserId));
      expect(familyFactory.createFamily).not.toHaveBeenCalled();
      expect(familyRepository.save).not.toHaveBeenCalled();
    });

    it('it should create a family with different roles', async () => {
      const userId = makeObjectId();
      const command = new CreateFamilyCommand('Santos Family', userId, FamilyRole.MOTHER);

      const mockFamily = {} as jest.Mocked<Family>;
      familyRepository.findByPrincipalResponsible.mockResolvedValue(null);
      familyFactory.createFamily.mockReturnValue(mockFamily);
      familyRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(familyRepository.findByPrincipalResponsible).toHaveBeenCalledWith(expect.any(UserId));
      expect(familyFactory.createFamily).toHaveBeenCalledWith(
        'Santos Family',
        userId,
        FamilyRole.MOTHER,
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });

    it('it should throw a error when the repository save fails', async () => {
      const userId = makeObjectId();
      const command = new CreateFamilyCommand('Santos Family', userId, FamilyRole.MOTHER);

      const mockFamily = {} as jest.Mocked<Family>;
      const repositoryError = new Error('Database connection failed');

      familyRepository.findByPrincipalResponsible.mockResolvedValue(null);
      familyFactory.createFamily.mockReturnValue(mockFamily);
      familyRepository.save.mockRejectedValue(repositoryError);

      await expect(handler.execute(command)).rejects.toThrow(repositoryError);

      expect(familyRepository.findByPrincipalResponsible).toHaveBeenCalledWith(expect.any(UserId));
      expect(familyFactory.createFamily).toHaveBeenCalledWith(
        'Santos Family',
        userId,
        FamilyRole.MOTHER,
      );
      expect(familyRepository.save).toHaveBeenCalledWith(mockFamily);
    });

    it('it should throw a error when the factory createFamily fails', async () => {
      const userId = makeObjectId();
      const command = new CreateFamilyCommand('Santos Family', userId, FamilyRole.MOTHER);

      const factoryError = new Error('Invalid family data');
      familyRepository.findByPrincipalResponsible.mockResolvedValue(null);
      familyFactory.createFamily.mockImplementation(() => {
        throw factoryError;
      });

      await expect(handler.execute(command)).rejects.toThrow(factoryError);

      expect(familyRepository.findByPrincipalResponsible).toHaveBeenCalledWith(expect.any(UserId));
      expect(familyFactory.createFamily).toHaveBeenCalledWith(
        'Santos Family',
        userId,
        FamilyRole.MOTHER,
      );
      expect(familyRepository.save).not.toHaveBeenCalled();
    });
  });
});
