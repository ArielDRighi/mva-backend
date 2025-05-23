import { Test, TestingModule } from '@nestjs/testing';
import { FutureCleaningsController } from './futureCleanings.controller';
import { FutureCleaningsService } from './futureCleanings.service';
import { CreateFutureCleaningDto } from './__mocks__/dto/createFutureCleanings.dto';
import { ModifyFutureCleaningDto } from './__mocks__/dto/modifyFutureCleanings.dto';
import { BadRequestException } from '@nestjs/common';

// Mocks for external entities
jest.mock(
  'src/clients/entities/client.entity',
  () => ({
    Cliente: class Cliente {},
  }),
  { virtual: true },
);

jest.mock(
  'src/services/entities/service.entity',
  () => ({
    Service: class Service {},
  }),
  { virtual: true },
);

// Mocks for roles
jest.mock(
  'src/roles/enums/role.enum',
  () => ({
    Role: {
      ADMIN: 'admin',
      SUPERVISOR: 'supervisor',
      OPERARIO: 'operario',
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/roles/decorators/roles.decorator',
  () => ({
    Roles: () => jest.fn(),
  }),
  { virtual: true },
);

jest.mock(
  'src/roles/guards/roles.guard',
  () => ({
    RolesGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }),
  { virtual: true },
);

jest.mock(
  'src/auth/guards/jwt-auth.guard',
  () => ({
    JwtAuthGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  }),
  { virtual: true },
);

// Mock the future cleanings entity
jest.mock('./entities/futureCleanings.entity', () => ({
  FuturasLimpiezas: class FuturasLimpiezas {
    id: number;
    cliente: any;
    fecha_de_limpieza: Date;
    isActive: boolean;
    numero_de_limpieza: number;
    servicio: any;
  },
}));

describe('FutureCleaningsController', () => {
  let controller: FutureCleaningsController;
  let service: FutureCleaningsService;

  const mockFutureCleaningsService = {
    getAll: jest.fn(),
    getById: jest.fn(),
    deleteFutureCleaning: jest.fn(),
    createFutureCleaning: jest.fn(),
    updateFutureCleaning: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FutureCleaningsController],
      providers: [
        {
          provide: FutureCleaningsService,
          useValue: mockFutureCleaningsService,
        },
      ],
    }).compile();

    controller = module.get<FutureCleaningsController>(
      FutureCleaningsController,
    );
    service = module.get<FutureCleaningsService>(FutureCleaningsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllFutureClenaings', () => {
    const mockFutureCleanings = [
      {
        id: 1,
        cliente: { clienteId: 1, nombre: 'Client 1' },
        fecha_de_limpieza: new Date('2025-05-15'),
        isActive: true,
        numero_de_limpieza: 1,
        servicio: { id: 1, nombre: 'Service 1' },
      },
      {
        id: 2,
        cliente: { clienteId: 2, nombre: 'Client 2' },
        fecha_de_limpieza: new Date('2025-05-20'),
        isActive: true,
        numero_de_limpieza: 1,
        servicio: { id: 2, nombre: 'Service 2' },
      },
    ];

    it('should return all future cleanings', async () => {
      mockFutureCleaningsService.getAll.mockResolvedValue(mockFutureCleanings);

      const result = await controller.getAllFutureClenaings();

      expect(result).toEqual(mockFutureCleanings);
      expect(mockFutureCleaningsService.getAll).toHaveBeenCalled();
    });

    it('should throw BadRequestException if service throws an error', async () => {
      const errorMessage = 'No future cleanings found';
      mockFutureCleaningsService.getAll.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getAllFutureClenaings()).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getFutureCleaningById', () => {
    const mockFutureCleaning = {
      id: 1,
      cliente: { clienteId: 1, nombre: 'Client 1' },
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      numero_de_limpieza: 1,
      servicio: { id: 1, nombre: 'Service 1' },
    };

    it('should return a future cleaning by id', async () => {
      mockFutureCleaningsService.getById.mockResolvedValue(mockFutureCleaning);

      const result = await controller.getFutureCleaningById(1);

      expect(result).toEqual(mockFutureCleaning);
      expect(mockFutureCleaningsService.getById).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if service throws an error', async () => {
      const errorMessage = 'Future cleaning not found';
      mockFutureCleaningsService.getById.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.getFutureCleaningById(999)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('deleteFutureCleaning', () => {
    const mockResponse = {
      message: 'Future cleaning deleted successfully',
    };

    it('should delete a future cleaning successfully', async () => {
      mockFutureCleaningsService.deleteFutureCleaning.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.deleteFutureCleaning(1);

      expect(result).toEqual(mockResponse);
      expect(
        mockFutureCleaningsService.deleteFutureCleaning,
      ).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if service throws an error', async () => {
      const errorMessage = 'Future cleaning not found';
      mockFutureCleaningsService.deleteFutureCleaning.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(controller.deleteFutureCleaning(999)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createFutureCleaning', () => {
    const createFutureCleaningDto: CreateFutureCleaningDto = {
      clientId: 1,
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      servicioId: 1,
    };

    const mockCreatedFutureCleaning = {
      id: 1,
      cliente: { clienteId: 1, nombre: 'Client 1' },
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      numero_de_limpieza: 1,
      servicio: { id: 1, nombre: 'Service 1' },
    };

    it('should create a future cleaning successfully', async () => {
      mockFutureCleaningsService.createFutureCleaning.mockResolvedValue(
        mockCreatedFutureCleaning,
      );

      const result = await controller.createFutureCleaning(
        createFutureCleaningDto,
      );

      expect(result).toEqual(mockCreatedFutureCleaning);
      expect(
        mockFutureCleaningsService.createFutureCleaning,
      ).toHaveBeenCalledWith(createFutureCleaningDto);
    });

    it('should throw BadRequestException if service throws an error', async () => {
      const errorMessage = 'Client not found';
      mockFutureCleaningsService.createFutureCleaning.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.createFutureCleaning(createFutureCleaningDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateFutureCleaning', () => {
    const modifyFutureCleaningDto: ModifyFutureCleaningDto = {
      isActive: false,
    };

    const mockResponse = {
      message: 'Future cleaning updated successfully',
    };

    it('should update a future cleaning successfully', async () => {
      mockFutureCleaningsService.updateFutureCleaning.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.updateFutureCleaning(
        1,
        modifyFutureCleaningDto,
      );

      expect(result).toEqual(mockResponse);
      expect(
        mockFutureCleaningsService.updateFutureCleaning,
      ).toHaveBeenCalledWith(1, modifyFutureCleaningDto);
    });

    it('should throw BadRequestException if service throws an error', async () => {
      const errorMessage = 'Future cleaning not found';
      mockFutureCleaningsService.updateFutureCleaning.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.updateFutureCleaning(999, modifyFutureCleaningDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
