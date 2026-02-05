import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import { ClientService } from '../clients/clients.service';
import { EmployeesService } from '../employees/employees.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import { VehicleMaintenanceService } from '../vehicle_maintenance/vehicle_maintenance.service';
import { ToiletMaintenanceService } from '../toilet_maintenance/toilet_maintenance.service';
import { EmployeeLeavesService } from '../employee_leaves/employee-leaves.service';
import { FutureCleaningsService } from '../future_cleanings/futureCleanings.service';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ServiceState,
  ServiceType,
  ResourceState,
} from '../common/enums/resource-states.enum';
import { FilterServicesDto } from './dto/filter-service.dto';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Empleado } from '../employees/entities/employee.entity';
import { Cliente } from '../clients/entities/client.entity';
import { MailerService } from '../mailer/mailer.service';
import {
  CondicionesContractuales,
  EstadoContrato,
  Periodicidad,
} from '../contractual_conditions/entities/contractual_conditions.entity';

describe('ServicesService', () => {
  let service: ServicesService;
  let serviceRepository: Repository<Service>;
  let assignmentRepository: Repository<ResourceAssignment>;
  let clientService: ClientService;
  let employeesService: EmployeesService;
  let vehiclesService: VehiclesService;
  let toiletsService: ChemicalToiletsService;
  let vehicleMaintenanceService: VehicleMaintenanceService;
  let toiletMaintenanceService: ToiletMaintenanceService;
  let employeeLeavesService: EmployeeLeavesService;
  let futureCleaningsService: FutureCleaningsService;
  let dataSource: DataSource;

  // Mock data
  const mockCliente = {
    clienteId: 1,
    nombre_empresa: 'Constructora XYZ',
    cuit: '30-71234567-0',
    email: 'contacto@xyz.com',
    telefono: '11-1234-5678',
  };

  const mockEmpleado = {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    estado: ResourceState.DISPONIBLE,
  };

  const mockEmpleado2 = {
    id: 2,
    nombre: 'María',
    apellido: 'Gómez',
    email: 'maria.gomez@example.com',
    estado: ResourceState.DISPONIBLE,
  };

  const mockVehiculo = {
    id: 1,
    placa: 'ABC123',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2023,
    estado: ResourceState.DISPONIBLE,
  };

  const mockBano = {
    baño_id: 1,
    codigo_interno: 'BQ-001',
    modelo: 'Standard',
    estado: ResourceState.DISPONIBLE,
  };

  const mockBano2 = {
    baño_id: 2,
    codigo_interno: 'BQ-002',
    modelo: 'Premium',
    estado: ResourceState.DISPONIBLE,
  };

  const mockResourceAssignment = {
    id: 1,
    servicioId: 1,
    empleadoId: 1,
    vehiculoId: 1,
    banoId: 1,
    empleado: mockEmpleado,
    vehiculo: mockVehiculo,
    bano: mockBano,
    fechaAsignacion: new Date('2025-06-01'),
  };
  const mockService = {
    id: 1,
    clienteId: 1,
    fechaProgramada: new Date('2025-06-15T09:00:00.000Z'),
    fechaInicio: new Date('2025-06-15T09:00:00.000Z'),
    fechaFin: new Date('2025-06-15T18:00:00.000Z'),
    fechaFinAsignacion: new Date('2025-06-15T18:00:00.000Z'),
    fechaCreacion: new Date('2025-06-01T09:00:00.000Z'),
    tipoServicio: ServiceType.INSTALACION,
    estado: ServiceState.PROGRAMADO,
    cantidadBanos: 2,
    cantidadEmpleados: 2,
    empleadoAId: 1,
    empleadoBId: 2,
    cantidadVehiculos: 1,
    ubicacion: 'Av. Rivadavia 1234, CABA',
    notas: 'Ubicación de fácil acceso',
    asignacionAutomatica: true,
    banosInstalados: [3, 4],
    condicionContractualId: null,
    comentarioIncompleto: null,
    cliente: mockCliente,
    asignaciones: [mockResourceAssignment],
    futurasLimpiezas: [],
  };

  const mockPaginatedResult = {
    data: [mockService],
    totalItems: 1,
    currentPage: 1,
    totalPages: 1,
  };

  const mockContrato = {
    condicionContractualId: 1,
    cliente: mockCliente,
    fecha_inicio: new Date('2025-01-01'),
    fecha_fin: new Date('2025-12-31'),
    condiciones_especificas: 'Mantenimiento semanal',
    tarifa: 5000,
    tarifa_alquiler: 2000,
    tarifa_instalacion: 1500,
    tarifa_limpieza: 1500,
    periodicidad: Periodicidad.SEMANAL,
    estado: EstadoContrato.ACTIVO,
    tipo_servicio: ServiceType.INSTALACION,
    cantidad_banos: 3,
  } as unknown as CondicionesContractuales;

  // Mock repositories
  const mockServiceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockService], 1]),
    })),
  };

  const mockAssignmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockVehiclesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockToiletsRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockCondicionesContractualesRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockEmpleadosRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockClientesRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  // Mock services
  const mockClientService = {
    findOneClient: jest.fn(),
  };

  const mockEmployeesService = {
    getAvailableEmployees: jest.fn(),
    findOne: jest.fn(),
    findAll: jest
      .fn()
      .mockResolvedValue({ data: [mockEmpleado, mockEmpleado2] }),
    changeStatus: jest.fn(),
  };

  const mockVehiclesService = {
    getAvailableVehicles: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [mockVehiculo] }),
    changeStatus: jest.fn(),
  };

  const mockToiletsService = {
    getAvailableToilets: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [mockBano, mockBano2] }),
    update: jest.fn(),
  };

  const mockVehicleMaintenanceService = {
    findUpcomingMaintenancesByVehicle: jest.fn(),
  };

  const mockToiletMaintenanceService = {
    findUpcomingMaintenancesByToilet: jest.fn(),
    calculateMaintenanceDays: jest.fn(),
  };

  const mockEmployeeLeavesService = {
    findActiveLeavesByEmployee: jest.fn(),
  };

  const mockFutureCleaningsService = {
    createFutureCleaning: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
    sendEmail: jest.fn(),
  };

  // Mock DataSource
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
      findOne: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE SERVICES SERVICE ========');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
        {
          provide: getRepositoryToken(ResourceAssignment),
          useValue: mockAssignmentRepository,
        },
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehiclesRepository,
        },
        {
          provide: getRepositoryToken(ChemicalToilet),
          useValue: mockToiletsRepository,
        },
        {
          provide: getRepositoryToken(CondicionesContractuales),
          useValue: mockCondicionesContractualesRepository,
        },
        {
          provide: getRepositoryToken(Empleado),
          useValue: mockEmpleadosRepository,
        },
        {
          provide: getRepositoryToken(Cliente),
          useValue: mockClientesRepository,
        },
        {
          provide: ClientService,
          useValue: mockClientService,
        },
        {
          provide: EmployeesService,
          useValue: mockEmployeesService,
        },
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
        {
          provide: ChemicalToiletsService,
          useValue: mockToiletsService,
        },
        {
          provide: VehicleMaintenanceService,
          useValue: mockVehicleMaintenanceService,
        },
        {
          provide: ToiletMaintenanceService,
          useValue: mockToiletMaintenanceService,
        },
        {
          provide: EmployeeLeavesService,
          useValue: mockEmployeeLeavesService,
        },
        {
          provide: FutureCleaningsService,
          useValue: mockFutureCleaningsService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    serviceRepository = module.get<Repository<Service>>(
      getRepositoryToken(Service),
    );
    assignmentRepository = module.get<Repository<ResourceAssignment>>(
      getRepositoryToken(ResourceAssignment),
    );
    clientService = module.get<ClientService>(ClientService);
    employeesService = module.get<EmployeesService>(EmployeesService);
    vehiclesService = module.get<VehiclesService>(VehiclesService);
    toiletsService = module.get<ChemicalToiletsService>(ChemicalToiletsService);
    vehicleMaintenanceService = module.get<VehicleMaintenanceService>(
      VehicleMaintenanceService,
    );
    toiletMaintenanceService = module.get<ToiletMaintenanceService>(
      ToiletMaintenanceService,
    );
    employeeLeavesService = module.get<EmployeeLeavesService>(
      EmployeeLeavesService,
    );
    futureCleaningsService = module.get<FutureCleaningsService>(
      FutureCleaningsService,
    );
    dataSource = module.get<DataSource>(DataSource);

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mocks
    mockServiceRepository.findOne.mockResolvedValue(mockService);
    mockServiceRepository.save.mockResolvedValue(mockService);
    mockServiceRepository.create.mockReturnValue(mockService);
    mockServiceRepository.find.mockResolvedValue([mockService]);

    mockEmployeesService.getAvailableEmployees.mockResolvedValue([
      mockEmpleado,
      mockEmpleado2,
    ]);
    mockVehiclesService.getAvailableVehicles.mockResolvedValue([mockVehiculo]);
    mockToiletsService.getAvailableToilets.mockResolvedValue([
      mockBano,
      mockBano2,
    ]);

    mockToiletMaintenanceService.calculateMaintenanceDays.mockReturnValue([
      new Date('2025-06-22T09:00:00.000Z'),
      new Date('2025-06-29T09:00:00.000Z'),
    ]);

    mockCondicionesContractualesRepository.findOne.mockResolvedValue(
      mockContrato,
    );

    mockQueryRunner.manager.save.mockImplementation((entity) => {
      if (typeof entity === 'string' && entity === 'future_cleanings') {
        return Promise.resolve({ id: 1 });
      }
      return Promise.resolve(mockService);
    });
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El servicio de servicios debería estar definido');
    expect(service).toBeDefined();
  });
  describe('create', () => {
    it('should create a new service', async () => {
      console.log('🧪 TEST: Debe crear un nuevo servicio');
      // Arrange
      const createServiceDto: CreateServiceDto = {
        clienteId: 1,
        fechaProgramada: new Date('2025-06-15T09:00:00.000Z'),
        tipoServicio: ServiceType.INSTALACION,
        cantidadBanos: 2,
        cantidadVehiculos: 1,
        ubicacion: 'Av. Rivadavia 1234, CABA',
        notas: 'Ubicación de fácil acceso',
        asignacionAutomatica: true,
      };

      // Mock resource checking to avoid errors
      jest
        .spyOn(service as any, 'verifyResourcesAvailability')
        .mockResolvedValue(true);
      jest
        .spyOn(service as any, 'assignResourcesAutomatically')
        .mockResolvedValue(true);

      // Act
      const result = await service.create(createServiceDto);

      // Assert
      expect(result).toEqual(mockService);
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
    it('should create a service with contractual conditions', async () => {
      console.log(
        '🧪 TEST: Debe crear un servicio con condiciones contractuales',
      );
      // Arrange
      const createServiceDto: CreateServiceDto = {
        clienteId: 1,
        condicionContractualId: 1,
        fechaProgramada: new Date('2025-06-15T09:00:00.000Z'),
        cantidadVehiculos: 1,
        ubicacion: 'Av. Rivadavia 1234, CABA',
        asignacionAutomatica: true,
      };

      // Mock resource checking to avoid errors
      jest
        .spyOn(service as any, 'verifyResourcesAvailability')
        .mockResolvedValue(true);
      jest
        .spyOn(service as any, 'assignResourcesAutomatically')
        .mockResolvedValue(true);

      // Act
      const result = await service.create(createServiceDto);

      // Assert
      expect(result).toEqual(mockService);
      expect(
        mockCondicionesContractualesRepository.findOne,
      ).toHaveBeenCalledWith({
        where: { condicionContractualId: 1 },
        relations: ['cliente'],
      });
    });

    it('should handle transaction rollback on error', async () => {
      console.log(
        '🧪 TEST: Debe manejar el rollback de transacción en caso de error',
      );
      // Arrange
      const createServiceDto: CreateServiceDto = {
        clienteId: 1,
        fechaProgramada: new Date('2025-06-15T09:00:00.000Z'),
        tipoServicio: ServiceType.INSTALACION,
        cantidadBanos: 2,
        cantidadVehiculos: 1,
        ubicacion: 'Av. Rivadavia 1234, CABA',
        asignacionAutomatica: true,
      };

      mockQueryRunner.manager.save.mockRejectedValueOnce(
        new Error('Error al guardar'),
      );

      // Mock resource checking to avoid errors
      jest
        .spyOn(service as any, 'verifyResourcesAvailability')
        .mockResolvedValue(true);

      // Act & Assert
      await expect(service.create(createServiceDto)).rejects.toThrow(Error);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of services', async () => {
      console.log('🧪 TEST: Debe retornar una lista paginada de servicios');
      // Arrange
      const filterDto: FilterServicesDto = {};
      const page = 1;
      const limit = 10;

      // Act
      const result = await service.findAll(filterDto, page, limit);

      // Assert
      expect(result).toEqual(mockPaginatedResult);
      expect(serviceRepository.createQueryBuilder).toHaveBeenCalled();
    });
    it('should apply search filters when provided', async () => {
      console.log(
        '🧪 TEST: Debe aplicar filtros de búsqueda cuando se proporcionan',
      );
      // Arrange
      const filterDto: FilterServicesDto = { search: 'instalación' };
      const page = 1;
      const limit = 10;

      // Make sure where is called
      const whereMock = jest.fn().mockReturnThis();
      mockServiceRepository.createQueryBuilder = jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: whereMock,
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockService], 1]),
      });

      // Act
      await service.findAll(filterDto, page, limit);

      // Assert
      expect(whereMock).toHaveBeenCalled();
    });
    it('should handle database errors', async () => {
      console.log('🧪 TEST: Debe manejar errores de base de datos');
      // Arrange
      // Force an error in the mock
      mockServiceRepository.createQueryBuilder = jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockRejectedValue(new Error('Error de base de datos')),
      });

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow(
        'Error al obtener los servicios',
      );
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      console.log('🧪 TEST: Debe retornar un servicio por ID');
      // Act
      const result = await service.findOne(1);

      // Assert
      expect(result).toEqual(mockService);
      expect(serviceRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: [
          'cliente',
          'asignaciones',
          'asignaciones.empleado',
          'asignaciones.vehiculo',
          'asignaciones.bano',
        ],
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el servicio no se encuentra',
      );
      // Arrange
      mockServiceRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
  describe('findByDateRange', () => {
    it('should return services in a date range', async () => {
      console.log('🧪 TEST: Debe retornar servicios en un rango de fechas');
      // Arrange
      // Mock findAll to return expected structure
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockPaginatedResult);

      // Act
      const result = await service.findByDateRange('2025-06-01', '2025-06-30');

      // Assert
      expect(result).toEqual(mockPaginatedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getCurrentWeekServices', () => {
    it('should return services for the current week (Monday to Sunday)', async () => {
      console.log('🧪 TEST: Debe retornar servicios de la semana actual (Lunes a Domingo)');
      
      // Arrange
      const mockServices = [
        {
          ...mockService,
          id: 1,
          fechaProgramada: new Date('2026-02-02T10:00:00'), // Lunes
        },
        {
          ...mockService,
          id: 2,
          fechaProgramada: new Date('2026-02-04T14:00:00'), // Miércoles
        },
        {
          ...mockService,
          id: 3,
          fechaProgramada: new Date('2026-02-08T09:00:00'), // Domingo
        },
      ];

      const queryBuilder: any = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockServices),
      };

      jest.spyOn(serviceRepository, 'createQueryBuilder').mockReturnValue(queryBuilder);

      // Act
      const result = await service.getCurrentWeekServices();

      // Assert
      expect(result).toEqual(mockServices);
      expect(result).toHaveLength(3);
      expect(serviceRepository.createQueryBuilder).toHaveBeenCalledWith('service');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('service.asignaciones', 'asignacion');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('service.cliente', 'cliente');
      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.andWhere).toHaveBeenCalled();
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('service.fechaProgramada', 'ASC');
      expect(queryBuilder.getMany).toHaveBeenCalled();
    });

    it('should handle Sunday as day 0 correctly', async () => {
      console.log('🧪 TEST: Debe manejar el domingo (día 0) correctamente');
      
      // Arrange - Mock simple para servicios
      const queryBuilder: any = {
        createQueryBuilder: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(serviceRepository, 'createQueryBuilder').mockReturnValue(queryBuilder);

      // Act
      await service.getCurrentWeekServices();

      // Assert - Verificar que se llamó correctamente al query builder
      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.andWhere).toHaveBeenCalled();
      
      // Verificar que se están buscando servicios entre lunes y domingo
      const whereCall = queryBuilder.where.mock.calls[0];
      const andWhereCall = queryBuilder.andWhere.mock.calls[0];
      expect(whereCall[0]).toContain('fechaProgramada >= :monday');
      expect(andWhereCall[0]).toContain('fechaProgramada <= :sunday');
    });
  });

  describe('findToday', () => {
    it('should return services for today', async () => {
      console.log('🧪 TEST: Debe retornar servicios para hoy');
      // Arrange
      // Mock findAll to return expected structure
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockPaginatedResult);

      // Act
      const result = await service.findToday();

      // Assert
      expect(result).toEqual(mockPaginatedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });
  describe('findByStatus', () => {
    it('should return services by status', async () => {
      console.log('🧪 TEST: Debe retornar servicios por estado');
      // Arrange
      // Mock findAll to return expected structure
      jest.spyOn(service, 'findAll').mockResolvedValueOnce(mockPaginatedResult);

      // Act
      const result = await service.findByStatus(ServiceState.PROGRAMADO);

      // Assert
      expect(result).toEqual(mockPaginatedResult);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      console.log('🧪 TEST: Debe actualizar un servicio');
      // Arrange
      const updateServiceDto: UpdateServiceDto = {
        notas: 'Ubicación actualizada, entrada por el lateral',
        estado: ServiceState.EN_PROGRESO,
      };

      const updatedService = {
        ...mockService,
        ...updateServiceDto,
      };

      mockServiceRepository.save.mockResolvedValueOnce(updatedService);

      // Act
      const result = await service.update(1, updateServiceDto);

      // Assert
      expect(result).toEqual(updatedService);
      expect(serviceRepository.findOne).toHaveBeenCalled();
      expect(serviceRepository.save).toHaveBeenCalled();
    });

    it('should validate service capacity when updating to CAPACITACION type', async () => {
      console.log(
        '🧪 TEST: Debe validar la capacidad del servicio al actualizar a tipo CAPACITACION',
      );
      // Arrange
      const updateServiceDto: UpdateServiceDto = {
        tipoServicio: ServiceType.CAPACITACION,
        cantidadBanos: 1, // Esto debería fallar para CAPACITACION
      };

      // Act & Assert
      await expect(service.update(1, updateServiceDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
  describe('remove', () => {
    it('should remove a service', async () => {
      console.log('🧪 TEST: Debe eliminar un servicio');
      // Arrange
      mockAssignmentRepository.delete.mockResolvedValueOnce({ affected: 1 });
      mockServiceRepository.findOne.mockResolvedValueOnce({
        ...mockService,
        asignaciones: [mockResourceAssignment],
      });

      // Mock additional methods if needed for this test
      const mockDeleteResult = { affected: 1 };
      mockServiceRepository.delete.mockResolvedValueOnce(mockDeleteResult);

      // Mock serviceRepository.remove
      jest
        .spyOn(service as any, 'verifyResourcesAvailability')
        .mockResolvedValue(true);

      // Act
      await service.remove(1);

      // Assert
      expect(assignmentRepository.delete).toHaveBeenCalled();
      expect(serviceRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if service not found', async () => {
      console.log(
        '🧪 TEST: Debe lanzar NotFoundException si el servicio no se encuentra al eliminar',
      );
      // Arrange
      mockServiceRepository.findOne.mockResolvedValueOnce(null);

      // Act & Assert
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeStatus', () => {
    it('should change a service status', async () => {
      console.log('🧪 TEST: Debe cambiar el estado de un servicio');
      // Arrange
      const updatedService = {
        ...mockService,
        estado: ServiceState.COMPLETADO,
      };

      // Mock validateStatusTransition
      jest
        .spyOn(service as any, 'validateStatusTransition')
        .mockImplementation(() => true);
      mockServiceRepository.save.mockResolvedValueOnce(updatedService);

      // Act
      const result = await service.changeStatus(1, ServiceState.COMPLETADO);

      // Assert
      expect(result).toEqual(updatedService);
      expect(serviceRepository.findOne).toHaveBeenCalled();
      expect(serviceRepository.save).toHaveBeenCalled();
    });

    it('should add comentarioIncompleto when status is INCOMPLETO', async () => {
      console.log(
        '🧪 TEST: Debe agregar comentarioIncompleto cuando el estado es INCOMPLETO',
      );
      // Arrange
      const updatedService = {
        ...mockService,
        estado: ServiceState.INCOMPLETO,
        comentarioIncompleto: 'No se completó por mal clima',
      };

      // Mock validateStatusTransition
      jest
        .spyOn(service as any, 'validateStatusTransition')
        .mockImplementation(() => true);
      mockServiceRepository.save.mockResolvedValueOnce(updatedService);

      // Act
      const result = await service.changeStatus(
        1,
        ServiceState.INCOMPLETO,
        'No se completó por mal clima',
      );

      // Assert
      expect(result).toEqual(updatedService);
      expect(serviceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: ServiceState.INCOMPLETO,
          comentarioIncompleto: 'No se completó por mal clima',
        }),
      );
    });
  });
});
