import { Test, TestingModule } from '@nestjs/testing';
import {
  ToiletMaintenanceService,
  ToiletMaintenanceSchedulerService,
} from './toilet_maintenance.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Empleado } from '../employees/entities/employee.entity';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import { Repository, Between } from 'typeorm';
import { CreateToiletMaintenanceDto } from './dto/create_toilet_maintenance.dto';
import { UpdateToiletMaintenanceDto } from './dto/update_toilet_maintenance.dto';
import { ResourceState } from '../common/enums/resource-states.enum';
import { Periodicidad } from '../contractual_conditions/entities/contractual_conditions.entity';

describe('ToiletMaintenanceService', () => {
  let service: ToiletMaintenanceService;
  // Mock repository functions
  const mockMaintenanceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      return mockQueryBuilder;
    }),
  };
  const mockToiletsRepository = {
    findOne: jest.fn(),
  };

  const mockEmpleadoRepository = {
    findOne: jest.fn(),
  };

  // Mock ChemicalToiletsService
  const mockChemicalToiletsService = {
    update: jest.fn(),
  };

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

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE TOILET MAINTENANCE SERVICE ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToiletMaintenanceService,
        {
          provide: getRepositoryToken(ToiletMaintenance),
          useValue: mockMaintenanceRepository,
        },
        {
          provide: getRepositoryToken(ChemicalToilet),
          useValue: mockToiletsRepository,
        },
        {
          provide: ChemicalToiletsService,
          useValue: mockChemicalToiletsService,
        },
      ],
    }).compile();

    service = module.get<ToiletMaintenanceService>(ToiletMaintenanceService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log(
      '🧪 TEST: El servicio de mantenimiento de baños debería estar definido',
    );
    expect(service).toBeDefined();
  });

  describe('calculateMaintenanceDays', () => {
    it('should calculate maintenance days for daily periodicity', () => {
      console.log(
        '🧪 TEST: Debe calcular días de mantenimiento para periodicidad diaria',
      );
      // Arrange
      const startDate = new Date('2025-05-15');
      const endDate = new Date('2025-05-18');
      const periodicidad = Periodicidad.DIARIA;

      // Act
      const result = service.calculateMaintenanceDays(
        startDate,
        endDate,
        periodicidad,
      );

      // Assert
      expect(result.length).toBe(4); // 15, 16, 17, 18 May
      expect(result[0]).toEqual(new Date(startDate));
      expect(result[3]).toEqual(new Date('2025-05-18'));
    });
    it('should calculate maintenance days for weekly periodicity', () => {
      console.log(
        '🧪 TEST: Debe calcular días de mantenimiento para periodicidad semanal',
      );
      // Arrange
      const startDate = new Date('2025-05-15');
      const endDate = new Date('2025-06-15');
      const periodicidad = Periodicidad.SEMANAL;

      // Act
      const result = service.calculateMaintenanceDays(
        startDate,
        endDate,
        periodicidad,
      );

      // Assert
      expect(result.length).toBe(5); // 15 May, 22 May, 29 May, 5 June, 12 June
      expect(result[0]).toEqual(new Date(startDate));
      // Check that each date is 7 days after the previous one
      for (let i = 1; i < result.length; i++) {
        const prevDate = new Date(result[i - 1]);
        prevDate.setDate(prevDate.getDate() + 7);
        expect(result[i]).toEqual(new Date(prevDate));
      }
    });

    it('should calculate maintenance days for DOS_VECES_SEMANA periodicity', () => {
      console.log(
        '🧪 TEST: Debe calcular días de mantenimiento para dos veces por semana',
      );
      // Arrange
      const startDate = new Date('2025-05-15');
      const endDate = new Date('2025-05-30');
      const periodicidad = Periodicidad.DOS_VECES_SEMANA;

      // Act
      const result = service.calculateMaintenanceDays(
        startDate,
        endDate,
        periodicidad,
      );

      // Assert
      // Should have more maintenance dates than weekly but fewer than daily
      expect(result.length).toBeGreaterThan(2); // More than weekly
      expect(result.length).toBeLessThan(16); // Less than daily
      expect(result[0]).toEqual(new Date(startDate));
    });

    it('should calculate maintenance days for TRES_VECES_SEMANA periodicity', () => {
      console.log(
        '🧪 TEST: Debe calcular días de mantenimiento para tres veces por semana',
      );
      // Arrange
      const startDate = new Date('2025-05-15');
      const endDate = new Date('2025-05-30');
      const periodicidad = Periodicidad.TRES_VECES_SEMANA;

      // Act
      const result = service.calculateMaintenanceDays(
        startDate,
        endDate,
        periodicidad,
      );

      // Assert
      // Should have more maintenance dates than DOS_VECES_SEMANA
      expect(result.length).toBeGreaterThan(4);
      expect(result.length).toBeLessThan(16); // Less than daily
      expect(result[0]).toEqual(new Date(startDate));
    });

    it('should calculate maintenance days for CUATRO_VECES_SEMANA periodicity', () => {
      console.log(
        '🧪 TEST: Debe calcular días de mantenimiento para cuatro veces por semana',
      );
      // Arrange
      const startDate = new Date('2025-05-15');
      const endDate = new Date('2025-05-30');
      const periodicidad = Periodicidad.CUATRO_VECES_SEMANA;

      // Act
      const result = service.calculateMaintenanceDays(
        startDate,
        endDate,
        periodicidad,
      );

      // Assert
      // Should have more maintenance dates than TRES_VECES_SEMANA
      expect(result.length).toBeGreaterThan(6);
      expect(result.length).toBeLessThan(16); // Less than daily
      expect(result[0]).toEqual(new Date(startDate));
    });

    it('should throw BadRequestException if end date is before or equal to start date', () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException si la fecha fin es anterior o igual a la fecha inicio',
      );
      // Arrange
      const startDate = new Date('2025-05-15');
      const endDate = new Date('2025-05-14');
      const periodicidad = Periodicidad.DIARIA;

      // Act & Assert
      expect(() =>
        service.calculateMaintenanceDays(startDate, endDate, periodicidad),
      ).toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dates are null', () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException si las fechas son nulas',
      );
      // Act & Assert
      expect(() =>
        service.calculateMaintenanceDays(null, new Date(), Periodicidad.DIARIA),
      ).toThrow(BadRequestException);
      expect(() =>
        service.calculateMaintenanceDays(new Date(), null, Periodicidad.DIARIA),
      ).toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create and return a new toilet maintenance', async () => {
      console.log('🧪 TEST: Debe crear y retornar un nuevo mantenimiento');
      // Arrange
      const createDto: CreateToiletMaintenanceDto = {
        fecha_mantenimiento: new Date('2025-05-15'),
        tipo_mantenimiento: 'Limpieza profunda',
        descripcion: 'Limpieza integral y sanitización',
        tecnico_responsable: 'Juan Pérez',
        costo: 250.0,
        baño_id: 1,
      };

      mockToiletsRepository.findOne.mockResolvedValue(mockToilet);
      mockMaintenanceRepository.create.mockReturnValue(mockMaintenance);
      mockMaintenanceRepository.save.mockResolvedValue(mockMaintenance);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(mockToiletsRepository.findOne).toHaveBeenCalledWith({
        where: { baño_id: 1 },
      });
      expect(mockMaintenanceRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha_mantenimiento: createDto.fecha_mantenimiento,
          tipo_mantenimiento: createDto.tipo_mantenimiento,
          toilet: mockToilet,
          completado: false,
        }),
      );
      expect(mockMaintenanceRepository.save).toHaveBeenCalledWith(
        mockMaintenance,
      );
      expect(result).toEqual(mockMaintenance);
    });

    it('should throw NotFoundException if toilet is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el baño no se encuentra',
      );
      // Arrange
      const createDto: CreateToiletMaintenanceDto = {
        fecha_mantenimiento: new Date('2025-05-15'),
        tipo_mantenimiento: 'Limpieza profunda',
        descripcion: 'Limpieza integral y sanitización',
        tecnico_responsable: 'Juan Pérez',
        costo: 250.0,
        baño_id: 999,
      };

      mockToiletsRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockToiletsRepository.findOne).toHaveBeenCalledWith({
        where: { baño_id: 999 },
      });
    });

    it('should throw BadRequestException if toilet state is not DISPONIBLE', async () => {
      console.log(
        '🧪 TEST: Debe lanzar BadRequestException si el estado del baño no es DISPONIBLE',
      );
      // Arrange
      const createDto: CreateToiletMaintenanceDto = {
        fecha_mantenimiento: new Date('2025-05-15'),
        tipo_mantenimiento: 'Limpieza profunda',
        descripcion: 'Limpieza integral y sanitización',
        tecnico_responsable: 'Juan Pérez',
        costo: 250.0,
        baño_id: 1,
      };

      const unavailableToilet = {
        ...mockToilet,
        estado: ResourceState.MANTENIMIENTO,
      };
      mockToiletsRepository.findOne.mockResolvedValue(unavailableToilet);

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockToiletsRepository.findOne).toHaveBeenCalledWith({
        where: { baño_id: 1 },
      });
    });

    it('should change toilet state to EN_MANTENIMIENTO if maintenance is for today or past', async () => {
      console.log(
        '🧪 TEST: Debe cambiar el estado del baño a EN_MANTENIMIENTO si el mantenimiento es para hoy o antes',
      );
      // Arrange
      const createDto: CreateToiletMaintenanceDto = {
        fecha_mantenimiento: new Date(), // Today
        tipo_mantenimiento: 'Limpieza profunda',
        descripcion: 'Limpieza integral y sanitización',
        tecnico_responsable: 'Juan Pérez',
        costo: 250.0,
        baño_id: 1,
      };

      mockToiletsRepository.findOne.mockResolvedValue(mockToilet);
      mockMaintenanceRepository.create.mockReturnValue(mockMaintenance);
      mockMaintenanceRepository.save.mockResolvedValue(mockMaintenance);

      // Act
      await service.create(createDto);

      // Assert
      expect(mockChemicalToiletsService.update).toHaveBeenCalledWith(1, {
        estado: ResourceState.MANTENIMIENTO,
      });
    });

    it('should not change toilet state if maintenance is for future date', async () => {
      console.log(
        '🧪 TEST: No debe cambiar el estado del baño si el mantenimiento es para una fecha futura',
      );
      // Arrange
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // 5 days in the future

      const createDto: CreateToiletMaintenanceDto = {
        fecha_mantenimiento: futureDate,
        tipo_mantenimiento: 'Limpieza profunda',
        descripcion: 'Limpieza integral y sanitización',
        tecnico_responsable: 'Juan Pérez',
        costo: 250.0,
        baño_id: 1,
      };

      // Creamos un objeto toilet para este caso específico que tenga estado DISPONIBLE
      const availableToilet = {
        ...mockToilet,
        estado: ResourceState.DISPONIBLE,
      };
      mockToiletsRepository.findOne.mockResolvedValue(availableToilet);
      mockMaintenanceRepository.create.mockReturnValue(mockMaintenance);
      mockMaintenanceRepository.save.mockResolvedValue(mockMaintenance);

      // Act
      await service.create(createDto);

      // Assert
      expect(mockChemicalToiletsService.update).not.toHaveBeenCalled();
    });
  });

  describe('completeMaintenace', () => {
    it('should complete maintenance and set toilet state back to DISPONIBLE', async () => {
      console.log(
        '🧪 TEST: Debe completar el mantenimiento y establecer el estado del baño de vuelta a DISPONIBLE',
      );
      // Arrange
      mockMaintenanceRepository.findOne.mockResolvedValueOnce(mockMaintenance);
      mockMaintenanceRepository.save.mockResolvedValueOnce({
        ...mockMaintenance,
        completado: true,
        fechaCompletado: expect.any(Date),
        toilet: { ...mockToilet, estado: ResourceState.DISPONIBLE },
      });

      // Act
      const result = await service.completeMaintenace(1);

      // Assert
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { mantenimiento_id: 1 },
        relations: ['toilet'],
      });
      expect(mockChemicalToiletsService.update).toHaveBeenCalledWith(1, {
        estado: ResourceState.DISPONIBLE,
      });
      expect(result.completado).toBe(true);
      expect(result.fechaCompletado).toBeDefined();
      expect(result.toilet.estado).toBe(ResourceState.DISPONIBLE);
    });

    it('should fallback to load toilet relationship if not already loaded', async () => {
      console.log(
        '🧪 TEST: Debe cargar la relación del baño si no está ya cargada',
      );
      // Arrange
      const maintenanceWithoutToilet = { ...mockMaintenance, toilet: null };
      const maintenanceWithToilet = { ...mockMaintenance };

      mockMaintenanceRepository.findOne
        .mockResolvedValueOnce(maintenanceWithoutToilet)
        .mockResolvedValueOnce(maintenanceWithToilet);
      mockMaintenanceRepository.save.mockResolvedValueOnce({
        ...maintenanceWithToilet,
        completado: true,
        fechaCompletado: expect.any(Date),
      });

      // Act
      await service.completeMaintenace(1);

      // Assert
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockChemicalToiletsService.update).toHaveBeenCalledWith(1, {
        estado: ResourceState.DISPONIBLE,
      });
    });

    it('should throw NotFoundException if maintenance is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el mantenimiento no se encuentra',
      );
      // Arrange
      mockMaintenanceRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.completeMaintenace(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('hasScheduledMaintenance', () => {
    it('should return true if toilet has scheduled maintenance for a date', async () => {
      console.log(
        '🧪 TEST: Debe retornar true si el baño tiene mantenimiento programado para una fecha',
      );
      // Arrange
      const toiletId = 1;
      const date = new Date('2025-05-15');
      mockMaintenanceRepository.count.mockResolvedValueOnce(1);

      // Act
      const result = await service.hasScheduledMaintenance(toiletId, date);

      // Assert
      expect(mockMaintenanceRepository.count).toHaveBeenCalledWith({
        where: {
          toilet: { baño_id: toiletId },
          fecha_mantenimiento: expect.any(Object),
          completado: false,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false if toilet has no scheduled maintenance for a date', async () => {
      console.log(
        '🧪 TEST: Debe retornar false si el baño no tiene mantenimiento programado para una fecha',
      );
      // Arrange
      const toiletId = 1;
      const date = new Date('2025-05-15');
      mockMaintenanceRepository.count.mockResolvedValueOnce(0);

      // Act
      const result = await service.hasScheduledMaintenance(toiletId, date);

      // Assert
      expect(mockMaintenanceRepository.count).toHaveBeenCalledWith({
        where: {
          toilet: { baño_id: toiletId },
          fecha_mantenimiento: expect.any(Object),
          completado: false,
        },
      });
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all toilet maintenances', async () => {
      console.log('🧪 TEST: Debe retornar todos los mantenimientos de baños');
      // Arrange
      mockMaintenanceRepository.find.mockResolvedValueOnce(
        mockMaintenancesList,
      );

      // Act
      const result = await service.findAll();

      // Assert
      expect(mockMaintenanceRepository.find).toHaveBeenCalledWith({
        relations: ['toilet'],
      });
      expect(result).toEqual(mockMaintenancesList);
      expect(result.length).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return a maintenance by id', async () => {
      console.log('🧪 TEST: Debe retornar un mantenimiento por ID');
      // Arrange
      mockMaintenanceRepository.findOne.mockResolvedValueOnce(mockMaintenance);

      // Act
      const result = await service.findById(1);

      // Assert
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { mantenimiento_id: 1 },
        relations: ['toilet'],
      });
      expect(result).toEqual(mockMaintenance);
    });

    it('should throw NotFoundException if maintenance is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el mantenimiento no se encuentra',
      );
      // Arrange
      mockMaintenanceRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return a maintenance', async () => {
      console.log('🧪 TEST: Debe actualizar y retornar un mantenimiento');
      // Arrange
      const updateDto: UpdateToiletMaintenanceDto = {
        tipo_mantenimiento: 'Reparación avanzada',
        descripcion: 'Reparación de puerta y grifo',
      };

      mockMaintenanceRepository.findOne.mockResolvedValueOnce(mockMaintenance);
      const updatedMaintenance = {
        ...mockMaintenance,
        ...updateDto,
      };
      mockMaintenanceRepository.save.mockResolvedValueOnce(updatedMaintenance);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { mantenimiento_id: 1 },
        relations: ['toilet'],
      });
      expect(mockMaintenanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockMaintenance,
          ...updateDto,
        }),
      );
      expect(result).toEqual(updatedMaintenance);
    });

    it('should update toilet reference if baño_id is provided', async () => {
      console.log(
        '🧪 TEST: Debe actualizar la referencia del baño si se proporciona baño_id',
      );
      // Arrange
      const updateDto: UpdateToiletMaintenanceDto = {
        baño_id: 2,
      };

      const newToilet = {
        baño_id: 2,
        codigo_interno: 'TOI-002',
        modelo: 'Estándar',
        fecha_adquisicion: new Date('2023-02-15'),
        estado: ResourceState.DISPONIBLE,
      };

      mockMaintenanceRepository.findOne.mockResolvedValueOnce(mockMaintenance);
      mockToiletsRepository.findOne.mockResolvedValueOnce(newToilet);

      const updatedMaintenance = {
        ...mockMaintenance,
        toilet: newToilet,
      };
      mockMaintenanceRepository.save.mockResolvedValueOnce(updatedMaintenance);

      // Act
      const result = await service.update(1, updateDto);

      // Assert
      expect(mockToiletsRepository.findOne).toHaveBeenCalledWith({
        where: { baño_id: 2 },
      });
      expect(mockMaintenanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockMaintenance,
          toilet: newToilet,
        }),
      );
      expect(result.toilet).toEqual(newToilet);
    });

    it('should throw NotFoundException if maintenance is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el mantenimiento no se encuentra',
      );
      // Arrange
      mockMaintenanceRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.update(999, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if new toilet is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el nuevo baño no se encuentra',
      );
      // Arrange
      const updateDto: UpdateToiletMaintenanceDto = {
        baño_id: 999,
      };

      mockMaintenanceRepository.findOne.mockResolvedValueOnce(mockMaintenance);
      mockToiletsRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.update(1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a maintenance', async () => {
      console.log('🧪 TEST: Debe eliminar un mantenimiento');
      // Arrange
      mockMaintenanceRepository.findOne.mockResolvedValueOnce(mockMaintenance);

      // Act
      await service.delete(1);

      // Assert
      expect(mockMaintenanceRepository.findOne).toHaveBeenCalledWith({
        where: { mantenimiento_id: 1 },
      });
      expect(mockMaintenanceRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if maintenance is not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el mantenimiento no se encuentra',
      );
      // Arrange
      mockMaintenanceRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });
  describe('findAllWithFilters', () => {
    it('should filter by baño_id', async () => {
      console.log('🧪 TEST: Debe filtrar por baño_id');
      // Arrange
      const filterDto = { baño_id: 1 };
      // Mock implementation para este test específico
      const mockAndWhere = jest.fn().mockReturnThis();
      const mockGetMany = jest.fn().mockResolvedValue([mockMaintenance]);
      mockMaintenanceRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: mockAndWhere,
        getMany: mockGetMany,
      });

      // Act
      const result = await service.findAllWithFilters(filterDto);

      // Assert
      expect(mockMaintenanceRepository.createQueryBuilder).toHaveBeenCalledWith(
        'maintenance',
      );
      expect(mockAndWhere).toHaveBeenCalledWith('toilet.baño_id = :toiletId', {
        toiletId: 1,
      });
      expect(result).toEqual([mockMaintenance]);
    });

    it('should filter by tipo_mantenimiento', async () => {
      console.log('🧪 TEST: Debe filtrar por tipo_mantenimiento');
      // Arrange
      const filterDto = { tipo_mantenimiento: 'Limpieza' };
      // Mock implementation para este test específico
      const mockAndWhere = jest.fn().mockReturnThis();
      const mockGetMany = jest.fn().mockResolvedValue([mockMaintenance]);
      mockMaintenanceRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: mockAndWhere,
        getMany: mockGetMany,
      });

      // Act
      const result = await service.findAllWithFilters(filterDto);

      // Assert
      expect(mockAndWhere).toHaveBeenCalledWith(
        'maintenance.tipo_mantenimiento LIKE :tipo',
        {
          tipo: '%Limpieza%',
        },
      );
      expect(result).toEqual([mockMaintenance]);
    });

    it('should apply multiple filters', async () => {
      console.log('🧪 TEST: Debe aplicar múltiples filtros');
      // Arrange
      const filterDto = {
        baño_id: 1,
        tipo_mantenimiento: 'Limpieza',
        tecnico_responsable: 'Juan',
        fechaDesde: '2025-05-01',
        fechaHasta: '2025-05-31',
      };

      // Mock implementation para este test específico
      const mockAndWhere = jest.fn().mockReturnThis();
      const mockGetMany = jest.fn().mockResolvedValue([mockMaintenance]);
      mockMaintenanceRepository.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: mockAndWhere,
        getMany: mockGetMany,
      });

      // Act
      const result = await service.findAllWithFilters(filterDto);

      // Assert
      expect(mockAndWhere).toHaveBeenCalledTimes(5);
      expect(result).toEqual([mockMaintenance]);
    });
  });

  describe('getMantenimientosStats', () => {
    it('should return maintenance statistics for a toilet', async () => {
      console.log(
        '🧪 TEST: Debe retornar estadísticas de mantenimiento para un baño',
      );
      // Arrange
      mockMaintenanceRepository.find.mockResolvedValueOnce(
        mockMaintenancesList,
      );

      // Act
      const result = await service.getMantenimientosStats(1);

      // Assert
      expect(mockMaintenanceRepository.find).toHaveBeenCalledWith({
        where: { toilet: { baño_id: 1 } },
        relations: ['toilet'],
      });

      expect(result).toHaveProperty('totalMantenimientos', 2);
      expect(result).toHaveProperty('costoTotal');
      expect(result).toHaveProperty('costoPromedio');
      expect(result).toHaveProperty('tiposMantenimiento');
      expect(result).toHaveProperty('ultimoMantenimiento');
    });

    it('should throw NotFoundException if no maintenances are found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si no se encuentran mantenimientos',
      );
      // Arrange
      mockMaintenanceRepository.find.mockResolvedValueOnce([]);

      // Act & Assert
      await expect(service.getMantenimientosStats(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

describe('ToiletMaintenanceSchedulerService', () => {
  let schedulerService: ToiletMaintenanceSchedulerService;

  // Mock repository functions
  const mockMaintenanceRepository = {
    find: jest.fn(),
  };

  // Mock ChemicalToiletsService
  const mockChemicalToiletsService = {
    update: jest.fn(),
  };

  // Mock data
  const mockToilet = {
    baño_id: 1,
    codigo_interno: 'TOI-001',
    modelo: 'Premium',
    fecha_adquisicion: new Date('2023-01-15'),
    estado: ResourceState.DISPONIBLE,
  };

  const mockScheduledMaintenance = {
    mantenimiento_id: 1,
    fecha_mantenimiento: new Date(),
    tipo_mantenimiento: 'Limpieza profunda',
    descripcion: 'Limpieza integral y sanitización',
    tecnico_responsable: 'Juan Pérez',
    costo: 250.0,
    completado: false,
    toilet: mockToilet,
  };

  beforeEach(async () => {
    console.log(
      '======== PREPARANDO TESTS DE TOILET MAINTENANCE SCHEDULER SERVICE ========',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToiletMaintenanceSchedulerService,
        {
          provide: getRepositoryToken(ToiletMaintenance),
          useValue: mockMaintenanceRepository,
        },
        {
          provide: ChemicalToiletsService,
          useValue: mockChemicalToiletsService,
        },
      ],
    }).compile();

    schedulerService = module.get<ToiletMaintenanceSchedulerService>(
      ToiletMaintenanceSchedulerService,
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio scheduler debería estar definido');
    expect(schedulerService).toBeDefined();
  });

  describe('handleScheduledMaintenances', () => {
    it("should update toilet states for today's scheduled maintenances", async () => {
      console.log(
        '🧪 TEST: Debe actualizar estados de baños para mantenimientos programados para hoy',
      );
      // Arrange
      mockMaintenanceRepository.find.mockResolvedValueOnce([
        mockScheduledMaintenance,
      ]);

      // Act
      await schedulerService.handleScheduledMaintenances();

      // Assert
      expect(mockMaintenanceRepository.find).toHaveBeenCalledWith({
        where: {
          fecha_mantenimiento: expect.any(Object),
          completado: false,
        },
        relations: ['toilet'],
      });

      expect(mockChemicalToiletsService.update).toHaveBeenCalledWith(1, {
        estado: ResourceState.MANTENIMIENTO,
      });
    });

    it('should not update toilet states if no scheduled maintenances for today', async () => {
      console.log(
        '🧪 TEST: No debe actualizar estados de baños si no hay mantenimientos programados para hoy',
      );
      // Arrange
      mockMaintenanceRepository.find.mockResolvedValueOnce([]);

      // Act
      await schedulerService.handleScheduledMaintenances();

      // Assert
      expect(mockMaintenanceRepository.find).toHaveBeenCalled();
      expect(mockChemicalToiletsService.update).not.toHaveBeenCalled();
    });
  });
});
