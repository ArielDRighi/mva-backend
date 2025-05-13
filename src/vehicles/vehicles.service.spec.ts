import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehicle, TipoCabina } from './entities/vehicle.entity';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create_vehicle.dto';
import { UpdateVehicleDto } from './dto/update_vehicle.dto';
import { ResourceState } from '../common/enums/resource-states.enum';

describe('VehiclesService', () => {
  let service: VehiclesService;

  // Mock repository functions
  const mockVehicleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getCount: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  // Mock data
  const mockVehicle = {
    id: 1,
    placa: 'ABC123',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2023,
    tipoCabina: TipoCabina.DOBLE,
    numeroInterno: 'VH-001',
    fechaVencimientoVTV: new Date('2026-05-15'),
    fechaVencimientoSeguro: new Date('2026-01-10'),
    esExterno: false,
    estado: ResourceState.DISPONIBLE,
    maintenanceRecords: [],
  };

  const mockVehiclesList = [
    mockVehicle,
    {
      ...mockVehicle,
      id: 2,
      placa: 'XYZ789',
      numeroInterno: 'VH-002',
      estado: ResourceState.ASIGNADO,
    },
  ];

  const mockPaginatedResponse = {
    data: mockVehiclesList,
    totalItems: 2,
    currentPage: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE VEHICLES SERVICE ========');

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);

    // Setup default mocks
    mockVehicleRepository.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockVehiclesList),
      getCount: jest.fn().mockResolvedValue(mockVehiclesList.length),
      getOne: jest.fn().mockResolvedValue(null),
    });
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de vehículos debería estar definido');
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new vehicle', async () => {
      console.log('🧪 TEST: Debe crear un nuevo vehículo');
      // Arrange
      const createVehicleDto: CreateVehicleDto = {
        placa: 'NEW123',
        marca: 'Ford',
        modelo: 'Ranger',
        anio: 2022,
        numeroInterno: 'VH-003',
        tipoCabina: TipoCabina.SIMPLE,
        fechaVencimientoVTV: '2026-12-31',
        fechaVencimientoSeguro: '2026-12-31',
        esExterno: false,
        estado: ResourceState.DISPONIBLE,
      };

      mockVehicleRepository.findOne.mockResolvedValue(null); // Placa no encontrada
      mockVehicleRepository.create.mockReturnValue({
        ...createVehicleDto,
        id: 3,
      });
      mockVehicleRepository.save.mockResolvedValue({
        ...createVehicleDto,
        id: 3,
      });

      // Act
      const result = await service.create(createVehicleDto);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.placa).toBe(createVehicleDto.placa);
      expect(result.marca).toBe(createVehicleDto.marca);
      expect(result.modelo).toBe(createVehicleDto.modelo);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { placa: 'NEW123' },
      });
      expect(mockVehicleRepository.create).toHaveBeenCalledWith(
        createVehicleDto,
      );
      expect(mockVehicleRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException when plate already exists', async () => {
      console.log(
        '🧪 TEST: Debe lanzar ConflictException cuando la placa ya existe',
      );
      // Arrange
      const createVehicleDto: CreateVehicleDto = {
        placa: 'ABC123', // Existing plate
        marca: 'Ford',
        modelo: 'Ranger',
        anio: 2022,
        estado: ResourceState.DISPONIBLE,
      };

      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle); // Placa encontrada

      // Act & Assert
      await expect(service.create(createVehicleDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { placa: 'ABC123' },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated vehicles list without search', async () => {
      console.log(
        '🧪 TEST: Debe retornar lista paginada de vehículos sin búsqueda',
      );
      // Arrange
      const page = 1;
      const limit = 10;

      // Act
      const result = await service.findAll(page, limit);

      // Assert
      expect(result).toEqual(mockPaginatedResponse);
      expect(mockVehicleRepository.createQueryBuilder).toHaveBeenCalledWith(
        'vehicle',
      );
      const queryBuilderMock =
        mockVehicleRepository.createQueryBuilder.mock.results[0].value;
      expect(queryBuilderMock.skip).toHaveBeenCalledWith(0);
      expect(queryBuilderMock.take).toHaveBeenCalledWith(10);
      expect(queryBuilderMock.getMany).toHaveBeenCalled();
      expect(queryBuilderMock.getCount).toHaveBeenCalled();
    });

    it('should return filtered vehicles list with search term', async () => {
      console.log(
        '🧪 TEST: Debe retornar lista filtrada de vehículos con término de búsqueda',
      );
      // Arrange
      const page = 1;
      const limit = 10;
      const searchTerm = 'Toyota';

      // Act
      const result = await service.findAll(page, limit, searchTerm);

      // Assert
      expect(result).toEqual(mockPaginatedResponse);
      const queryBuilderMock =
        mockVehicleRepository.createQueryBuilder.mock.results[0].value;
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        expect.stringContaining(
          'LOWER(UNACCENT(vehicle.placa)) LIKE :searchTerm',
        ),
        expect.objectContaining({ searchTerm: '%toyota%' }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a vehicle when vehicle exists', async () => {
      console.log('🧪 TEST: Debe retornar un vehículo cuando existe');
      // Arrange
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['maintenanceRecords'],
      });
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el vehículo no existe',
      );
      // Arrange
      mockVehicleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
        relations: ['maintenanceRecords'],
      });
    });
  });

  describe('findByPlaca', () => {
    it('should return a vehicle when plate exists', async () => {
      console.log('🧪 TEST: Debe retornar un vehículo cuando la placa existe');
      // Arrange
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      // Act
      const result = await service.findByPlaca('ABC123');

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { placa: 'ABC123' },
      });
    });

    it('should throw NotFoundException when plate does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando la placa no existe',
      );
      // Arrange
      mockVehicleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findByPlaca('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockVehicleRepository.findOne).toHaveBeenCalledWith({
        where: { placa: 'NONEXISTENT' },
      });
    });
  });

  describe('changeStatus', () => {
    it('should change vehicle status successfully', async () => {
      console.log('🧪 TEST: Debe cambiar el estado del vehículo correctamente');
      // Arrange
      mockVehicleRepository.findOne.mockResolvedValue(mockVehicle);

      const updatedVehicle = {
        ...mockVehicle,
        estado: ResourceState.EN_MANTENIMIENTO,
      };

      mockVehicleRepository.save.mockResolvedValue(updatedVehicle);

      // Act
      const result = await service.changeStatus(
        1,
        ResourceState.EN_MANTENIMIENTO,
      );

      // Assert
      expect(result.estado).toBe(ResourceState.EN_MANTENIMIENTO);
      expect(mockVehicleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          estado: ResourceState.EN_MANTENIMIENTO,
        }),
      );
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el vehículo no existe',
      );
      // Arrange
      mockVehicleRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changeStatus(999, ResourceState.FUERA_DE_SERVICIO),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEstado', () => {
    it('should return vehicles with specified status', async () => {
      console.log(
        '🧪 TEST: Debe retornar vehículos con el estado especificado',
      );
      // Arrange
      const vehiclesWithStatus = [mockVehicle];
      mockVehicleRepository.find.mockResolvedValue(vehiclesWithStatus);

      // Act
      const result = await service.findByEstado(ResourceState.DISPONIBLE);

      // Assert
      expect(result).toEqual(vehiclesWithStatus);
      expect(mockVehicleRepository.find).toHaveBeenCalledWith({
        where: { estado: ResourceState.DISPONIBLE },
      });
    });

    it('should return empty array when no vehicles with specified status', async () => {
      console.log(
        '🧪 TEST: Debe retornar array vacío cuando no hay vehículos con el estado especificado',
      );
      // Arrange
      mockVehicleRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findByEstado(ResourceState.BAJA);

      // Assert
      expect(result).toEqual([]);
      expect(mockVehicleRepository.find).toHaveBeenCalledWith({
        where: { estado: ResourceState.BAJA },
      });
    });
  });
});
