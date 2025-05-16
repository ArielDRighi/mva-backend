import { Test, TestingModule } from '@nestjs/testing';
import { VehicleMaintenanceService } from './vehicle_maintenance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleMaintenanceRecord } from './entities/vehicle_maintenance_record.entity';
import { VehiclesService } from '../vehicles/vehicles.service';
import { CreateMaintenanceDto } from './dto/create_maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update_maintenance.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ResourceState } from '../common/enums/resource-states.enum';
import { Between, MoreThanOrEqual } from 'typeorm';

describe('VehicleMaintenanceService', () => {
  let service: VehicleMaintenanceService;

  // Mock repository
  const mockMaintenanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  // Mock vehicles service
  const mockVehiclesService = {
    findOne: jest.fn(),
    changeStatus: jest.fn(),
  };

  // Mock data
  const mockVehicle = {
    id: 1,
    placa: 'ABC123',
    marca: 'Toyota',
    modelo: 'Hilux',
    estado: ResourceState.DISPONIBLE,
    maintenanceRecords: [],
  };

  const mockMaintenanceRecord = {
    id: 1,
    vehiculoId: 1,
    fechaMantenimiento: new Date('2025-06-15T10:00:00.000Z'),
    tipoMantenimiento: 'Preventivo',
    descripcion: 'Cambio de aceite y filtros',
    costo: 15000.5,
    proximoMantenimiento: new Date('2025-09-15'),
    completado: false,
    fechaCompletado: null,
    vehicle: mockVehicle,
  };

  const mockMaintenanceRecordList = [
    mockMaintenanceRecord,
    {
      ...mockMaintenanceRecord,
      id: 2,
      tipoMantenimiento: 'Correctivo',
      descripcion: 'Reparación de frenos',
    },
  ];

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE VEHICLE MAINTENANCE SERVICE ========',
    );

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleMaintenanceService,
        {
          provide: getRepositoryToken(VehicleMaintenanceRecord),
          useValue: mockMaintenanceRepository,
        },
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
      ],
    }).compile();

    service = module.get<VehicleMaintenanceService>(VehicleMaintenanceService);

    // Setup default mocks
    mockVehiclesService.findOne.mockResolvedValue(mockVehicle);
    mockMaintenanceRepository.findOne.mockResolvedValue(mockMaintenanceRecord);
    mockMaintenanceRepository.find.mockResolvedValue(mockMaintenanceRecordList);
    mockMaintenanceRepository.create.mockReturnValue(mockMaintenanceRecord);
    mockMaintenanceRepository.save.mockResolvedValue(mockMaintenanceRecord);
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El servicio de mantenimiento de vehículos debería estar definido',
    );
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new maintenance record for future date', async () => {
      console.log(
        '🧪 TEST: Debe crear un nuevo registro de mantenimiento para fecha futura',
      );
      // Arrange
      const createMaintenanceDto: CreateMaintenanceDto = {
        vehiculoId: 1,
        fechaMantenimiento: new Date('2025-06-15T10:00:00.000Z'), // Fecha futura
        tipoMantenimiento: 'Preventivo',
        descripcion: 'Cambio de aceite y filtros',
        costo: 15000.5,
        proximoMantenimiento: new Date('2025-09-15'),
      };
      mockVehiclesService.findOne.mockResolvedValue({
        ...mockVehicle,
        estado: ResourceState.DISPONIBLE,
      });

      // Act
      const result = await service.create(createMaintenanceDto);

      // Assert
      expect(result).toEqual(mockMaintenanceRecord);
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(1);
      expect(mockMaintenanceRepository.create).toHaveBeenCalledWith(
        createMaintenanceDto,
      );
      expect(mockMaintenanceRepository.save).toHaveBeenCalled();
      expect(mockVehiclesService.changeStatus).not.toHaveBeenCalled(); // No debería cambiar el estado para fechas futuras
    });

    it('should create a new maintenance record and change vehicle status for current date', async () => {
      console.log(
        '🧪 TEST: Debe crear un nuevo registro de mantenimiento y cambiar estado del vehículo para fecha actual',
      );
      // Arrange
      const today = new Date();
      const createMaintenanceDto: CreateMaintenanceDto = {
        vehiculoId: 1,
        fechaMantenimiento: today,
        tipoMantenimiento: 'Preventivo',
        descripcion: 'Cambio de aceite y filtros',
        costo: 15000.5,
        proximoMantenimiento: new Date('2025-09-15'),
      };

      mockVehiclesService.findOne.mockResolvedValue({
        ...mockVehicle,
        estado: ResourceState.DISPONIBLE,
      });

      // Act
      const result = await service.create(createMaintenanceDto);

      // Assert
      expect(result).toEqual(mockMaintenanceRecord);
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(1);
      expect(mockVehiclesService.changeStatus).toHaveBeenCalledWith(
        1,
        ResourceState.EN_MANTENIMIENTO,
      );
      expect(mockMaintenanceRepository.create).toHaveBeenCalledWith(
        createMaintenanceDto,
      );
      expect(mockMaintenanceRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when vehicle is not available for immediate maintenance', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException cuando el vehículo no está disponible para mantenimiento inmediato',
      );
      // Arrange
      const today = new Date();
      const createMaintenanceDto: CreateMaintenanceDto = {
        vehiculoId: 1,
        fechaMantenimiento: today,
        tipoMantenimiento: 'Preventivo',
        descripcion: 'Cambio de aceite y filtros',
        costo: 15000.5,
      };

      mockVehiclesService.findOne.mockResolvedValue({
        ...mockVehicle,
        estado: ResourceState.ASIGNADO, // Vehículo no disponible
      });

      // Act & Assert
      await expect(service.create(createMaintenanceDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(1);
      expect(mockMaintenanceRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when vehicle is not available or assigned for future maintenance', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException cuando el vehículo no está disponible o asignado para mantenimiento futuro',
      );
      // Arrange
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1); // Un mes en el futuro

      const createMaintenanceDto: CreateMaintenanceDto = {
        vehiculoId: 1,
        fechaMantenimiento: futureDate,
        tipoMantenimiento: 'Preventivo',
        descripcion: 'Cambio de aceite y filtros',
        costo: 15000.5,
      };

      mockVehiclesService.findOne.mockResolvedValue({
        ...mockVehicle,
        estado: ResourceState.FUERA_DE_SERVICIO, // Estado no válido para mantenimiento futuro
      });

      // Act & Assert
      await expect(service.create(createMaintenanceDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(1);
      expect(mockMaintenanceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('completeMaintenace', () => {
    it('should complete maintenance and change vehicle status to DISPONIBLE', async () => {
      console.log(
        '🧪 TEST: Debe completar el mantenimiento y cambiar el estado del vehículo a DISPONIBLE',
      );
      // Arrange
      const id = 1;
      const completedRecord = {
        ...mockMaintenanceRecord,
        completado: true,
        fechaCompletado: expect.any(Date),
      };
      mockMaintenanceRepository.save.mockResolvedValue(completedRecord);

      // Act
      const result = await service.completeMaintenace(id);

      // Assert
      expect(result.completado).toBe(true);
      expect(result.fechaCompletado).toBeDefined();
      expect(mockVehiclesService.changeStatus).toHaveBeenCalledWith(
        1,
        ResourceState.DISPONIBLE,
      );
      expect(mockMaintenanceRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when maintenance record does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el registro de mantenimiento no existe',
      );
      // Arrange
      const id = 999;
      mockMaintenanceRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.completeMaintenace(id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hasScheduledMaintenance', () => {
    it('should return true when vehicle has scheduled maintenance for the date', async () => {
      console.log(
        '🧪 TEST: Debe retornar true cuando el vehículo tiene mantenimiento programado para la fecha',
      );
      // Arrange
      const vehiculoId = 1;
      const fecha = new Date('2025-06-15');
      mockMaintenanceRepository.count.mockResolvedValue(1);

      // Act
      const result = await service.hasScheduledMaintenance(vehiculoId, fecha);

      // Assert
      expect(result).toBe(true);
      expect(mockMaintenanceRepository.count).toHaveBeenCalledWith({
        where: {
          vehiculoId,
          fechaMantenimiento: Between(expect.any(Date), expect.any(Date)),
          completado: false,
        },
      });
    });

    it('should return false when vehicle has no scheduled maintenance for the date', async () => {
      console.log(
        '🧪 TEST: Debe retornar false cuando el vehículo no tiene mantenimiento programado para la fecha',
      );
      // Arrange
      const vehiculoId = 1;
      const fecha = new Date('2025-06-15');
      mockMaintenanceRepository.count.mockResolvedValue(0);

      // Act
      const result = await service.hasScheduledMaintenance(vehiculoId, fecha);

      // Assert
      expect(result).toBe(false);
      expect(mockMaintenanceRepository.count).toHaveBeenCalledWith({
        where: {
          vehiculoId,
          fechaMantenimiento: Between(expect.any(Date), expect.any(Date)),
          completado: false,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all maintenance records', async () => {
      console.log(
        '🧪 TEST: Debe retornar todos los registros de mantenimiento',
      );
      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(mockMaintenanceRecordList);
      expect(mockMaintenanceRepository.find).toHaveBeenCalledWith({
        relations: ['vehicle'],
      });
    });
  });

  describe('findOne', () => {
    it('should return a maintenance record when it exists', async () => {
      console.log(
        '🧪 TEST: Debe retornar un registro de mantenimiento cuando existe',
      );
      // Arrange
      const id = 1;

      // Act
      const result = await service.findOne(id);

      // Assert
      expect(result).toEqual(mockMaintenanceRecord);
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['vehicle'],
      });
    });

    it('should throw NotFoundException when maintenance record does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el registro de mantenimiento no existe',
      );
      // Arrange
      const id = 999;
      mockMaintenanceRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['vehicle'],
      });
    });
  });

  describe('findByVehicle', () => {
    it('should return maintenance records for a specific vehicle', async () => {
      console.log(
        '🧪 TEST: Debe retornar registros de mantenimiento para un vehículo específico',
      );
      // Arrange
      const vehiculoId = 1;

      // Act
      const result = await service.findByVehicle(vehiculoId);

      // Assert
      expect(result).toEqual(mockMaintenanceRecordList);
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(vehiculoId); // Verificar que el vehículo existe
      expect(mockMaintenanceRepository.find).toHaveBeenCalledWith({
        where: { vehiculoId },
        relations: ['vehicle'],
        order: { fechaMantenimiento: 'DESC' },
      });
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el vehículo no existe',
      );
      // Arrange
      const vehiculoId = 999;
      mockVehiclesService.findOne.mockRejectedValue(new NotFoundException());

      // Act & Assert
      await expect(service.findByVehicle(vehiculoId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockVehiclesService.findOne).toHaveBeenCalledWith(vehiculoId);
      expect(mockMaintenanceRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findUpcomingMaintenances', () => {
    it('should return upcoming maintenance records', async () => {
      console.log(
        '🧪 TEST: Debe retornar registros de mantenimientos próximos',
      );
      // Act
      const result = await service.findUpcomingMaintenances();

      // Assert
      expect(result).toEqual(mockMaintenanceRecordList);
      expect(mockMaintenanceRepository.find).toHaveBeenCalledWith({
        where: {
          proximoMantenimiento: MoreThanOrEqual(expect.any(Date)),
        },
        relations: ['vehicle'],
        order: { proximoMantenimiento: 'ASC' },
      });
    });
  });

  describe('update', () => {
    it('should update a maintenance record', async () => {
      console.log('🧪 TEST: Debe actualizar un registro de mantenimiento');
      // Arrange
      const id = 1;
      const updateMaintenanceDto: UpdateMaintenanceDto = {
        tipoMantenimiento: 'Preventivo Completo',
        descripcion: 'Cambio de aceite, filtros y revisión de frenos',
      };
      const updatedRecord = {
        ...mockMaintenanceRecord,
        ...updateMaintenanceDto,
      };
      mockMaintenanceRepository.save.mockResolvedValue(updatedRecord);

      // Act
      const result = await service.update(id, updateMaintenanceDto);

      // Assert
      expect(result).toEqual(updatedRecord);
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['vehicle'],
      });
      expect(mockMaintenanceRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when maintenance record does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el registro de mantenimiento no existe',
      );
      // Arrange
      const id = 999;
      const updateMaintenanceDto: UpdateMaintenanceDto = {
        tipoMantenimiento: 'Preventivo Completo',
      };
      mockMaintenanceRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(id, updateMaintenanceDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['vehicle'],
      });
      expect(mockMaintenanceRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove a maintenance record', async () => {
      console.log('🧪 TEST: Debe eliminar un registro de mantenimiento');
      // Arrange
      const id = 1;

      // Act
      await service.remove(id);

      // Assert
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['vehicle'],
      });
      expect(mockMaintenanceRepository.remove).toHaveBeenCalledWith(
        mockMaintenanceRecord,
      );
    });

    it('should throw NotFoundException when maintenance record does not exist', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException cuando el registro de mantenimiento no existe',
      );
      // Arrange
      const id = 999;
      mockMaintenanceRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['vehicle'],
      });
      expect(mockMaintenanceRepository.remove).not.toHaveBeenCalled();
    });
  });
});
