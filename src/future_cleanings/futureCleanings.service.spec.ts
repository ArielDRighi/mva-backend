// Mocks for external entities
jest.mock(
  'src/clients/entities/client.entity',
  () => ({
    Cliente: class Cliente {
      clienteId: number;
      nombre: string;
      futurasLimpiezas: any[];
    },
  }),
  { virtual: true },
);

jest.mock(
  'src/services/entities/service.entity',
  () => ({
    Service: class Service {
      id: number;
      nombre: string;
      futurasLimpiezas: any[];
    },
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

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FutureCleaningsService } from './futureCleanings.service';
import { FuturasLimpiezas } from './entities/futureCleanings.entity';
import { Cliente } from 'src/clients/entities/client.entity';
import { Service } from 'src/services/entities/service.entity';
import { CreateFutureCleaningDto } from './__mocks__/dto/createFutureCleanings.dto';
import { ModifyFutureCleaningDto } from './__mocks__/dto/modifyFutureCleanings.dto';
import { BadRequestException } from '@nestjs/common';

describe('FutureCleaningsService', () => {
  let service: FutureCleaningsService;
  let futureCleaningsRepository: Repository<FuturasLimpiezas>;
  let clientRepository: Repository<Cliente>;
  let serviceRepository: Repository<Service>;

  const mockFutureCleaningsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockClientRepository = {
    findOne: jest.fn(),
  };

  const mockServiceRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FutureCleaningsService,
        {
          provide: getRepositoryToken(FuturasLimpiezas),
          useValue: mockFutureCleaningsRepository,
        },
        {
          provide: getRepositoryToken(Cliente),
          useValue: mockClientRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
      ],
    }).compile();

    service = module.get<FutureCleaningsService>(FutureCleaningsService);
    futureCleaningsRepository = module.get<Repository<FuturasLimpiezas>>(
      getRepositoryToken(FuturasLimpiezas),
    );
    clientRepository = module.get<Repository<Cliente>>(
      getRepositoryToken(Cliente),
    );
    serviceRepository = module.get<Repository<Service>>(
      getRepositoryToken(Service),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAll', () => {
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
      mockFutureCleaningsRepository.find.mockResolvedValue(mockFutureCleanings);

      const result = await service.getAll();

      expect(result).toEqual(mockFutureCleanings);
      expect(mockFutureCleaningsRepository.find).toHaveBeenCalledWith({
        relations: ['cliente', 'servicio'],
      });
    });

    it('should throw BadRequestException if no future cleanings found', async () => {
      mockFutureCleaningsRepository.find.mockResolvedValue(null);

      await expect(service.getAll()).rejects.toThrow(BadRequestException);
    });
  });

  describe('getById', () => {
    const mockFutureCleaning = {
      id: 1,
      cliente: { clienteId: 1, nombre: 'Client 1' },
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      numero_de_limpieza: 1,
      servicio: { id: 1, nombre: 'Service 1' },
    };

    it('should return a future cleaning by id', async () => {
      mockFutureCleaningsRepository.findOne.mockResolvedValue(
        mockFutureCleaning,
      );

      const result = await service.getById(1);

      expect(result).toEqual(mockFutureCleaning);
      expect(mockFutureCleaningsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['cliente', 'servicio'],
      });
    });

    it('should throw BadRequestException if future cleaning not found', async () => {
      mockFutureCleaningsRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFutureCleaning', () => {
    const mockFutureCleaning = {
      id: 1,
      cliente: { clienteId: 1, nombre: 'Client 1' },
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      numero_de_limpieza: 1,
      servicio: { id: 1, nombre: 'Service 1' },
    };

    it('should delete a future cleaning successfully', async () => {
      mockFutureCleaningsRepository.findOne.mockResolvedValue(
        mockFutureCleaning,
      );
      mockFutureCleaningsRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteFutureCleaning(1);

      expect(result).toEqual({
        message: 'Future cleaning deleted successfully',
      });
      expect(mockFutureCleaningsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockFutureCleaningsRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException if future cleaning not found', async () => {
      mockFutureCleaningsRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteFutureCleaning(999)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateFutureCleaning', () => {
    const mockFutureCleaning = {
      id: 1,
      cliente: { clienteId: 1, nombre: 'Client 1' },
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      numero_de_limpieza: 1,
      servicio: { id: 1, nombre: 'Service 1' },
    };

    const modifyFutureCleaningDto: ModifyFutureCleaningDto = {
      isActive: false,
    };

    it('should update a future cleaning successfully', async () => {
      mockFutureCleaningsRepository.findOne.mockResolvedValue(
        mockFutureCleaning,
      );
      mockFutureCleaningsRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.updateFutureCleaning(
        1,
        modifyFutureCleaningDto,
      );

      expect(result).toEqual({
        message: 'Future cleaning updated successfully',
      });
      expect(mockFutureCleaningsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockFutureCleaningsRepository.update).toHaveBeenCalledWith(1, {
        isActive: modifyFutureCleaningDto.isActive,
      });
    });

    it('should throw BadRequestException if future cleaning not found', async () => {
      mockFutureCleaningsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateFutureCleaning(999, modifyFutureCleaningDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createFutureCleaning', () => {
    const createFutureCleaningDto: CreateFutureCleaningDto = {
      clientId: 1,
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      servicioId: 1,
    };

    const mockClient = {
      clienteId: 1,
      nombre: 'Client 1',
    };

    const mockServiceEntity = {
      id: 1,
      nombre: 'Service 1',
    };

    const mockCreatedFutureCleaning = {
      id: 1,
      cliente: mockClient,
      fecha_de_limpieza: new Date('2025-05-15'),
      isActive: true,
      numero_de_limpieza: 1,
      servicio: mockServiceEntity,
    };

    it('should create a future cleaning successfully', async () => {
      mockClientRepository.findOne.mockResolvedValue(mockClient);
      mockServiceRepository.findOne.mockResolvedValue(mockServiceEntity);
      mockFutureCleaningsRepository.create.mockReturnValue(
        mockCreatedFutureCleaning,
      );
      mockFutureCleaningsRepository.save.mockResolvedValue(
        mockCreatedFutureCleaning,
      );

      const result = await service.createFutureCleaning(
        createFutureCleaningDto,
      );

      expect(result).toEqual(mockCreatedFutureCleaning);
      expect(mockClientRepository.findOne).toHaveBeenCalledWith({
        where: { clienteId: createFutureCleaningDto.clientId },
      });
      expect(mockServiceRepository.findOne).toHaveBeenCalledWith({
        where: { id: createFutureCleaningDto.servicioId },
      });
      expect(mockFutureCleaningsRepository.create).toHaveBeenCalledWith({
        cliente: mockClient,
        fecha_de_limpieza: createFutureCleaningDto.fecha_de_limpieza,
        isActive: createFutureCleaningDto.isActive,
        servicio: mockServiceEntity,
      });
      expect(mockFutureCleaningsRepository.save).toHaveBeenCalledWith(
        mockCreatedFutureCleaning,
      );
    });

    it('should throw BadRequestException if client not found', async () => {
      mockClientRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createFutureCleaning(createFutureCleaningDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if service not found', async () => {
      mockClientRepository.findOne.mockResolvedValue(mockClient);
      mockServiceRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createFutureCleaning(createFutureCleaningDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if save operation fails', async () => {
      mockClientRepository.findOne.mockResolvedValue(mockClient);
      mockServiceRepository.findOne.mockResolvedValue(mockServiceEntity);
      mockFutureCleaningsRepository.create.mockReturnValue(
        mockCreatedFutureCleaning,
      );
      mockFutureCleaningsRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.createFutureCleaning(createFutureCleaningDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
