import { Test, TestingModule } from '@nestjs/testing';
import { ToiletMaintenanceController } from './toilet_maintenance.controller';
import { ToiletMaintenanceService } from './toilet_maintenance.service';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { ResourceState } from '../common/enums/resource-states.enum';

describe('ToiletMaintenanceController', () => {
  let controller: ToiletMaintenanceController;

  // Mock data
  const mockToilet = {
    baño_id: 1,
    codigo_interno: 'TOI-001',
    modelo: 'Premium',
    fecha_adquisicion: new Date('2023-01-15'),
    estado: ResourceState.DISPONIBLE,
    maintenances: [],
  };

  const mockMaintenance = {
    mantenimiento_id: 1,
    fecha_mantenimiento: new Date('2025-05-15'),
    tipo_mantenimiento: 'Limpieza profunda',
    descripcion: 'Limpieza integral y sanitización',
    tecnico_responsable: 'Juan Pérez',
    costo: 250.0,
    completado: false,
    fechaCompletado: null,
    toilet: mockToilet,
  };

  const mockMaintenancesList = [
    mockMaintenance,
    {
      ...mockMaintenance,
      mantenimiento_id: 2,
      tipo_mantenimiento: 'Reparación',
      fecha_mantenimiento: new Date('2025-06-10'),
      descripcion: 'Reparación de puerta',
      costo: 180.0,
    },
  ];

  // Mock service
  const mockToiletMaintenanceService = {
    create: jest.fn().mockResolvedValue(mockMaintenance),
    findAll: jest.fn().mockResolvedValue(mockMaintenancesList),
    findById: jest.fn().mockResolvedValue(mockMaintenance),
    findAllWithFilters: jest.fn().mockResolvedValue(mockMaintenancesList),
    update: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        ...mockMaintenance,
        ...dto,
      }),
    ),
    delete: jest.fn().mockResolvedValue(undefined),
    completeMaintenace: jest.fn().mockResolvedValue({
      ...mockMaintenance,
      completado: true,
      fechaCompletado: new Date(),
    }),
    getMantenimientosStats: jest.fn().mockResolvedValue({
      totalMantenimientos: 2,
      costoTotal: 430,
      costoPromedio: 215,
      tiposMantenimiento: {
        'Limpieza profunda': 1,
        Reparación: 1,
      },
      ultimoMantenimiento: mockMaintenance,
    }),
  };

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE TOILET MAINTENANCE CONTROLLER ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToiletMaintenanceController],
      providers: [
        {
          provide: ToiletMaintenanceService,
          useValue: mockToiletMaintenanceService,
        },
      ],
    }).compile();

    controller = module.get<ToiletMaintenanceController>(
      ToiletMaintenanceController,
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El controlador de mantenimiento de baños debería estar definido',
    );
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new maintenance', async () => {
      console.log('🧪 TEST: Debe crear un nuevo mantenimiento');
      // Arrange
      const createDto = {
        fecha_mantenimiento: new Date('2025-05-15'),
        tipo_mantenimiento: 'Limpieza profunda',
        descripcion: 'Limpieza integral y sanitización',
        tecnico_responsable: 'Juan Pérez',
        costo: 250.0,
        baño_id: 1,
      };

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(mockToiletMaintenanceService.create).toHaveBeenCalledWith(
        createDto,
      );
      expect(result).toEqual(mockMaintenance);
    });
  });

  describe('findAll', () => {
    it('should return all maintenances', async () => {
      console.log('🧪 TEST: Debe retornar todos los mantenimientos');
      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockToiletMaintenanceService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockMaintenancesList);
      expect(result.length).toBe(2);
    });
  });

  describe('search', () => {
    it('should return filtered maintenances', async () => {
      console.log('🧪 TEST: Debe retornar mantenimientos filtrados');
      // Arrange
      const filterDto = {
        baño_id: 1,
        tipo_mantenimiento: 'Limpieza',
      };

      // Act
      const result = await controller.search(filterDto);

      // Assert
      expect(
        mockToiletMaintenanceService.findAllWithFilters,
      ).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockMaintenancesList);
    });
  });

  describe('getMaintenanceStats', () => {
    it('should return maintenance statistics for a toilet', async () => {
      console.log(
        '🧪 TEST: Debe retornar estadísticas de mantenimiento para un baño',
      );
      // Act
      const result = await controller.getMaintenanceStats(1);

      // Assert
      expect(
        mockToiletMaintenanceService.getMantenimientosStats,
      ).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty('totalMantenimientos');
      expect(result).toHaveProperty('costoTotal');
      expect(result).toHaveProperty('costoPromedio');
    });
  });

  describe('findById', () => {
    it('should return a maintenance by id', async () => {
      console.log('🧪 TEST: Debe retornar un mantenimiento por ID');
      // Act
      const result = await controller.findById(1);

      // Assert
      expect(mockToiletMaintenanceService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMaintenance);
    });
  });

  describe('update', () => {
    it('should update a maintenance', async () => {
      console.log('🧪 TEST: Debe actualizar un mantenimiento');
      // Arrange
      const updateDto = {
        tipo_mantenimiento: 'Reparación avanzada',
        descripcion: 'Reparación de puerta y grifo',
      };

      // Act
      const result = await controller.update(1, updateDto);

      // Assert
      expect(mockToiletMaintenanceService.update).toHaveBeenCalledWith(
        1,
        updateDto,
      );
      expect(result).toEqual({
        ...mockMaintenance,
        ...updateDto,
      });
    });
  });

  describe('delete', () => {
    it('should delete a maintenance', async () => {
      console.log('🧪 TEST: Debe eliminar un mantenimiento');
      // Act
      await controller.delete(1);

      // Assert
      expect(mockToiletMaintenanceService.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('completeMaintenace', () => {
    it('should complete a maintenance', async () => {
      console.log('🧪 TEST: Debe completar un mantenimiento');
      // Act
      const result = await controller.completeMaintenace(1);

      // Assert
      expect(
        mockToiletMaintenanceService.completeMaintenace,
      ).toHaveBeenCalledWith(1);
      expect(result.completado).toBe(true);
      expect(result.fechaCompletado).toBeDefined();
    });
  });
});
