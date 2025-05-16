import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create_vehicle.dto';
import { UpdateVehicleDto } from './dto/update_vehicle.dto';
import { Vehicle, TipoCabina } from './entities/vehicle.entity';
import { ResourceState } from '../common/enums/resource-states.enum';

describe('VehiclesController', () => {
  let controller: VehiclesController;

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

  // Mock service
  const mockVehiclesService = {
    create: jest.fn().mockResolvedValue(mockVehicle),
    findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findOne: jest.fn().mockResolvedValue(mockVehicle),
    findByPlaca: jest.fn().mockResolvedValue(mockVehicle),
    update: jest.fn(),
    remove: jest.fn(),
    changeStatus: jest.fn(),
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE VEHICLES CONTROLLER ========');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mocks
    mockVehiclesService.update.mockImplementation((id, dto) =>
      Promise.resolve({
        ...mockVehicle,
        ...dto,
      }),
    );

    mockVehiclesService.remove.mockResolvedValue({
      message: 'El vehículo id: 1 ha sido eliminado correctamente',
    });

    mockVehiclesService.changeStatus.mockImplementation((id, estado) =>
      Promise.resolve({
        ...mockVehicle,
        estado,
      }),
    );
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El controlador de vehículos debería estar definido');
    expect(controller).toBeDefined();
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

      // Act
      const result = await controller.create(createVehicleDto);

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehiclesService.create).toHaveBeenCalledWith(createVehicleDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated vehicles list', async () => {
      console.log('🧪 TEST: Debe retornar lista paginada de vehículos');
      // Arrange
      const page = 1;
      const limit = 10;
      const search = '';

      // Act
      const result = await controller.findAll(page, limit, search);

      // Assert
      expect(result).toEqual(mockPaginatedResponse);
      expect(mockVehiclesService.findAll).toHaveBeenCalledWith(
        page,
        limit,
        search,
      );
    });

    it('should call findAll with search term when provided', async () => {
      console.log(
        '🧪 TEST: Debe llamar a findAll con término de búsqueda cuando se proporciona',
      );
      // Arrange
      const page = 2;
      const limit = 5;
      const search = 'Toyota';

      // Act
      await controller.findAll(page, limit, search);

      // Assert
      expect(mockVehiclesService.findAll).toHaveBeenCalledWith(
        page,
        limit,
        search,
      );
    });
  });

  describe('findOne', () => {
    it('should return a specific vehicle by id', async () => {
      console.log('🧪 TEST: Debe retornar un vehículo específico por id');
      // Arrange
      const id = 1;

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('findByPlaca', () => {
    it('should return a specific vehicle by plate', async () => {
      console.log('🧪 TEST: Debe retornar un vehículo específico por placa');
      // Arrange
      const placa = 'ABC123';

      // Act
      const result = await controller.findByPlaca(placa);

      // Assert
      expect(result).toEqual(mockVehicle);
      expect(mockVehiclesService.findByPlaca).toHaveBeenCalledWith(placa);
    });
  });

  describe('update', () => {
    it('should update a vehicle', async () => {
      console.log('🧪 TEST: Debe actualizar un vehículo');
      // Arrange
      const id = 1;
      const updateVehicleDto: UpdateVehicleDto = {
        marca: 'Ford',
        modelo: 'F-150',
        tipoCabina: TipoCabina.DOBLE,
      };

      // Act
      const result = await controller.update(id, updateVehicleDto);

      // Assert
      expect(result).toEqual({
        ...mockVehicle,
        ...updateVehicleDto,
      });
      expect(mockVehiclesService.update).toHaveBeenCalledWith(
        id,
        updateVehicleDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a vehicle', async () => {
      console.log('🧪 TEST: Debe eliminar un vehículo');
      // Arrange
      const id = 1;
      const expectedResponse = {
        message: 'El vehículo id: 1 ha sido eliminado correctamente',
      };

      // Act
      const result = await controller.remove(id);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(mockVehiclesService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('changeStatus', () => {
    it('should change vehicle status', async () => {
      console.log('🧪 TEST: Debe cambiar el estado del vehículo');
      // Arrange
      const id = 1;
      const newStatus = ResourceState.EN_MANTENIMIENTO;

      // Act
      const result = await controller.changeStatus(id, newStatus);

      // Assert
      expect(result).toEqual({
        ...mockVehicle,
        estado: newStatus,
      });
      expect(mockVehiclesService.changeStatus).toHaveBeenCalledWith(
        id,
        newStatus,
      );
    });
  });
});
