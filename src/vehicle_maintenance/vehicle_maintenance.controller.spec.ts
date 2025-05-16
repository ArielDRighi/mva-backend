import { Test, TestingModule } from '@nestjs/testing';
import { VehicleMaintenanceController } from './vehicle_maintenance.controller';
import { VehicleMaintenanceService } from './vehicle_maintenance.service';
import { VehicleMaintenanceRecord } from './entities/vehicle_maintenance_record.entity';
import { CreateMaintenanceDto } from './dto/create_maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update_maintenance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('VehicleMaintenanceController', () => {
  let controller: VehicleMaintenanceController;
  let service: VehicleMaintenanceService;

  // Mock data
  const mockVehicle = {
    id: 1,
    placa: 'ABC123',
    marca: 'Toyota',
    modelo: 'Hilux',
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
    fechaCompletado: new Date(),
    vehicle: mockVehicle,
  } as VehicleMaintenanceRecord;

  const mockMaintenanceRecordList = [
    mockMaintenanceRecord,
    {
      ...mockMaintenanceRecord,
      id: 2,
      tipoMantenimiento: 'Correctivo',
      descripcion: 'Reparación de frenos',
    } as VehicleMaintenanceRecord,
  ];

  // Mock service
  const mockMaintenanceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByVehicle: jest.fn(),
    findUpcomingMaintenances: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    completeMaintenace: jest.fn(),
  };

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE VEHICLE MAINTENANCE CONTROLLER ========',
    );

    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleMaintenanceController],
      providers: [
        {
          provide: VehicleMaintenanceService,
          useValue: mockMaintenanceService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<VehicleMaintenanceController>(
      VehicleMaintenanceController,
    );
    service = module.get<VehicleMaintenanceService>(VehicleMaintenanceService);

    // Setup default mocks
    mockMaintenanceService.create.mockResolvedValue(mockMaintenanceRecord);
    mockMaintenanceService.findAll.mockResolvedValue(mockMaintenanceRecordList);
    mockMaintenanceService.findOne.mockResolvedValue(mockMaintenanceRecord);
    mockMaintenanceService.findByVehicle.mockResolvedValue(
      mockMaintenanceRecordList,
    );
    mockMaintenanceService.findUpcomingMaintenances.mockResolvedValue(
      mockMaintenanceRecordList,
    );
    mockMaintenanceService.update.mockResolvedValue(mockMaintenanceRecord);
    mockMaintenanceService.remove.mockResolvedValue(undefined);
    mockMaintenanceService.completeMaintenace.mockResolvedValue({
      ...mockMaintenanceRecord,
      completado: true,
      fechaCompletado: new Date(),
    });
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El controlador de mantenimiento de vehículos debería estar definido',
    );
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new maintenance record', async () => {
      console.log('🧪 TEST: Debe crear un nuevo registro de mantenimiento');
      // Arrange
      const createMaintenanceDto: CreateMaintenanceDto = {
        vehiculoId: 1,
        fechaMantenimiento: new Date('2025-06-15T10:00:00.000Z'),
        tipoMantenimiento: 'Preventivo',
        descripcion: 'Cambio de aceite y filtros',
        costo: 15000.5,
        proximoMantenimiento: new Date('2025-09-15'),
      };

      // Act
      const result = await controller.create(createMaintenanceDto);

      // Assert
      expect(result).toEqual(mockMaintenanceRecord);
      expect(mockMaintenanceService.create).toHaveBeenCalledWith(
        createMaintenanceDto,
      );
    });

    it('should pass through errors from service', async () => {
      console.log('🧪 TEST: Debe propagar errores del servicio');
      // Arrange
      const createMaintenanceDto: CreateMaintenanceDto = {
        vehiculoId: 1,
        fechaMantenimiento: new Date('2025-06-15T10:00:00.000Z'),
        tipoMantenimiento: 'Preventivo',
        descripcion: 'Cambio de aceite y filtros',
        costo: 15000.5,
      };
      mockMaintenanceService.create.mockRejectedValue(
        new BadRequestException('Error de validación'),
      );

      // Act & Assert
      await expect(controller.create(createMaintenanceDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockMaintenanceService.create).toHaveBeenCalledWith(
        createMaintenanceDto,
      );
    });
  });

  describe('findAll', () => {
    it('should return all maintenance records', async () => {
      console.log(
        '🧪 TEST: Debe retornar todos los registros de mantenimiento',
      );
      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(mockMaintenanceRecordList);
      expect(mockMaintenanceService.findAll).toHaveBeenCalled();
    });
  });

  describe('findUpcoming', () => {
    it('should return upcoming maintenance records', async () => {
      console.log(
        '🧪 TEST: Debe retornar registros de mantenimientos próximos',
      );
      // Act
      const result = await controller.findUpcoming();

      // Assert
      expect(result).toEqual(mockMaintenanceRecordList);
      expect(
        mockMaintenanceService.findUpcomingMaintenances,
      ).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a maintenance record by id', async () => {
      console.log('🧪 TEST: Debe retornar un registro de mantenimiento por id');
      // Arrange
      const id = 1;

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(result).toEqual(mockMaintenanceRecord);
      expect(mockMaintenanceService.findOne).toHaveBeenCalledWith(id);
    });

    it('should pass through errors from service', async () => {
      console.log('🧪 TEST: Debe propagar errores del servicio');
      // Arrange
      const id = 999;
      mockMaintenanceService.findOne.mockRejectedValue(
        new NotFoundException(
          `Registro de mantenimiento con id ${id} no encontrado`,
        ),
      );

      // Act & Assert
      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(mockMaintenanceService.findOne).toHaveBeenCalledWith(id);
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
      const result = await controller.findByVehicle(vehiculoId);

      // Assert
      expect(result).toEqual(mockMaintenanceRecordList);
      expect(mockMaintenanceService.findByVehicle).toHaveBeenCalledWith(
        vehiculoId,
      );
    });

    it('should pass through errors from service', async () => {
      console.log('🧪 TEST: Debe propagar errores del servicio');
      // Arrange
      const vehiculoId = 999;
      mockMaintenanceService.findByVehicle.mockRejectedValue(
        new NotFoundException(`Vehículo con id ${vehiculoId} no encontrado`),
      );

      // Act & Assert
      await expect(controller.findByVehicle(vehiculoId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMaintenanceService.findByVehicle).toHaveBeenCalledWith(
        vehiculoId,
      );
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
      mockMaintenanceService.update.mockResolvedValue(updatedRecord);

      // Act
      const result = await controller.update(id, updateMaintenanceDto);

      // Assert
      expect(result).toEqual(updatedRecord);
      expect(mockMaintenanceService.update).toHaveBeenCalledWith(
        id,
        updateMaintenanceDto,
      );
    });

    it('should pass through errors from service', async () => {
      console.log('🧪 TEST: Debe propagar errores del servicio');
      // Arrange
      const id = 999;
      const updateMaintenanceDto: UpdateMaintenanceDto = {
        tipoMantenimiento: 'Preventivo Completo',
      };
      mockMaintenanceService.update.mockRejectedValue(
        new NotFoundException(
          `Registro de mantenimiento con id ${id} no encontrado`,
        ),
      );

      // Act & Assert
      await expect(controller.update(id, updateMaintenanceDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMaintenanceService.update).toHaveBeenCalledWith(
        id,
        updateMaintenanceDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a maintenance record', async () => {
      console.log('🧪 TEST: Debe eliminar un registro de mantenimiento');
      // Arrange
      const id = 1;

      // Act
      await controller.remove(id);

      // Assert
      expect(mockMaintenanceService.remove).toHaveBeenCalledWith(id);
    });

    it('should pass through errors from service', async () => {
      console.log('🧪 TEST: Debe propagar errores del servicio');
      // Arrange
      const id = 999;
      mockMaintenanceService.remove.mockRejectedValue(
        new NotFoundException(
          `Registro de mantenimiento con id ${id} no encontrado`,
        ),
      );

      // Act & Assert
      await expect(controller.remove(id)).rejects.toThrow(NotFoundException);
      expect(mockMaintenanceService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('completeMaintenace', () => {
    it('should complete a maintenance and return the updated record', async () => {
      console.log(
        '🧪 TEST: Debe completar un mantenimiento y retornar el registro actualizado',
      );
      // Arrange
      const id = 1;
      const completedRecord = {
        ...mockMaintenanceRecord,
        completado: true,
        fechaCompletado: new Date(),
      };
      mockMaintenanceService.completeMaintenace.mockResolvedValue(
        completedRecord,
      );

      // Act
      const result = await controller.completeMaintenace(id);

      // Assert
      expect(result.completado).toBe(true);
      expect(result.fechaCompletado).toBeDefined();
      expect(mockMaintenanceService.completeMaintenace).toHaveBeenCalledWith(
        id,
      );
    });

    it('should pass through errors from service', async () => {
      console.log('🧪 TEST: Debe propagar errores del servicio');
      // Arrange
      const id = 999;
      mockMaintenanceService.completeMaintenace.mockRejectedValue(
        new NotFoundException(
          `Registro de mantenimiento con id ${id} no encontrado`,
        ),
      );

      // Act & Assert
      await expect(controller.completeMaintenace(id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockMaintenanceService.completeMaintenace).toHaveBeenCalledWith(
        id,
      );
    });
  });
});
