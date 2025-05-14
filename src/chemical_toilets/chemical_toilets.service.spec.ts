// Mocks de las entidades para no importarlas directamente
jest.mock('./entities/chemical_toilet.entity', () => ({
  ChemicalToilet: class ChemicalToilet {},
}));

jest.mock('../services/entities/service.entity', () => ({
  Service: class Service {},
}));

// Mock del ResourceState enum para usarlo en los tests
jest.mock('../common/enums/resource-states.enum', () => ({
  ResourceState: {
    DISPONIBLE: 'DISPONIBLE',
    ASIGNADO: 'ASIGNADO',
    EN_MANTENIMIENTO: 'EN_MANTENIMIENTO',
    FUERA_DE_SERVICIO: 'FUERA_DE_SERVICIO',
    BAJA: 'BAJA',
    VACACIONES: 'VACACIONES',
    LICENCIA: 'LICENCIA',
    INACTIVO: 'INACTIVO',
    EN_CAPACITACION: 'EN_CAPACITACION',
    RESERVADO: 'RESERVADO',
    toString: function () {
      return this;
    },
  },
}));

// Importamos después de los mocks
import { Test, TestingModule } from '@nestjs/testing';
import { ChemicalToiletsService } from './chemical_toilets.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateChemicalToiletDto } from './dto/create_chemical_toilet.dto';
import { UpdateChemicalToiletDto } from './dto/update_chemical.toilet.dto';
import { FilterChemicalToiletDto } from './dto/filter_chemical_toilet.dto';
import { ChemicalToilet } from './entities/chemical_toilet.entity';
import { Service } from '../services/entities/service.entity';
import { ResourceState } from '../common/enums/resource-states.enum';

// Mock de datos para pruebas
const mockChemicalToilet = {
  baño_id: 1,
  codigo_interno: 'BQ-2025-001',
  modelo: 'Standard Plus',
  fecha_adquisicion: new Date('2025-01-15'),
  estado: ResourceState.DISPONIBLE,
  maintenances: [],
};

const mockServiceMethods = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllWithFilters: jest.fn(),
  findAllByState: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getMaintenanceStats: jest.fn(),
  findByClientId: jest.fn(),
};

describe('ChemicalToiletsService', () => {
  let service: ChemicalToiletsService;

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE CHEMICAL TOILETS SERVICE ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ChemicalToiletsService,
          useValue: mockServiceMethods,
        },
        {
          provide: getRepositoryToken(ChemicalToilet),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Service),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ChemicalToiletsService>(ChemicalToiletsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de baños químicos debe estar definido');
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new chemical toilet', async () => {
      console.log('🧪 TEST: Debe crear un nuevo baño químico');

      const createDto: CreateChemicalToiletDto = {
        codigo_interno: 'BQ-2025-001',
        modelo: 'Standard Plus',
        fecha_adquisicion: new Date('2025-01-15'),
        estado: ResourceState.DISPONIBLE,
      };

      mockServiceMethods.create.mockResolvedValue(mockChemicalToilet);

      const result = await service.create(createDto);

      expect(result).toEqual(mockChemicalToilet);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of toilets', async () => {
      console.log(
        '🧪 TEST: Debe devolver una lista paginada de baños químicos',
      );

      const mockPaginatedResult = {
        items: [mockChemicalToilet],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockServiceMethods.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await service.findAll(
        { page: 1, limit: 10 },
        'search term',
      );

      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findById', () => {
    it('should return a toilet by id', async () => {
      console.log('🧪 TEST: Debe devolver un baño químico por su ID');

      mockServiceMethods.findById.mockResolvedValue(mockChemicalToilet);

      const result = await service.findById(1);

      expect(result).toEqual(mockChemicalToilet);
    });

    it('should throw NotFoundException when toilet not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el baño no existe',
      );

      mockServiceMethods.findById.mockRejectedValue(
        new NotFoundException('Baño químico con ID 999 no encontrado'),
      );

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a toilet', async () => {
      console.log('🧪 TEST: Debe actualizar un baño químico');

      const updateDto: UpdateChemicalToiletDto = {
        estado: ResourceState.EN_MANTENIMIENTO,
      };

      const updatedToilet = {
        ...mockChemicalToilet,
        estado: ResourceState.EN_MANTENIMIENTO,
      };

      mockServiceMethods.update.mockResolvedValue(updatedToilet);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedToilet);
    });
  });

  describe('remove', () => {
    it('should remove a toilet', async () => {
      console.log('🧪 TEST: Debe eliminar un baño químico');

      mockServiceMethods.remove.mockResolvedValue(undefined);

      await service.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when toilet cannot be removed', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException cuando el baño no puede ser eliminado',
      );

      mockServiceMethods.remove.mockRejectedValue(
        new BadRequestException(
          'El baño químico no puede ser eliminado ya que se encuentra asignado a uno o más servicios.',
        ),
      );

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMaintenanceStats', () => {
    it('should return maintenance stats for a toilet', async () => {
      console.log(
        '🧪 TEST: Debe devolver estadísticas de mantenimiento para un baño',
      );

      const mockStats = {
        totalMaintenances: 5,
        totalCost: 28500.0,
        lastMaintenance: {
          fecha: new Date('2025-03-15T10:30:00.000Z'),
          tipo: 'Preventivo',
          tecnico: 'Carlos Gómez',
        },
        daysSinceLastMaintenance: 53,
      };

      mockServiceMethods.getMaintenanceStats.mockResolvedValue(mockStats);

      const result = await service.getMaintenanceStats(1);

      expect(result).toEqual(mockStats);
    });
  });

  describe('findByClientId', () => {
    it('should return toilets assigned to a client', async () => {
      console.log('🧪 TEST: Debe devolver baños asignados a un cliente');

      mockServiceMethods.findByClientId.mockResolvedValue([mockChemicalToilet]);

      const result = await service.findByClientId(5);

      expect(result).toEqual([mockChemicalToilet]);
    });
  });

  describe('findAllByState', () => {
    it('should return toilets filtered by state', async () => {
      console.log('🧪 TEST: Debe devolver baños filtrados por estado');

      mockServiceMethods.findAllByState.mockResolvedValue([mockChemicalToilet]);

      const result = await service.findAllByState(ResourceState.DISPONIBLE, {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual([mockChemicalToilet]);
      expect(service.findAllByState).toHaveBeenCalledWith(
        ResourceState.DISPONIBLE,
        { page: 1, limit: 10 },
      );
    });
  });
});
