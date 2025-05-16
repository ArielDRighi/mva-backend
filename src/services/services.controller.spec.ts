import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ChangeServiceStatusDto } from './dto/change-service-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import {
  ServiceState,
  ServiceType,
} from '../common/enums/resource-states.enum';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { FilterServicesDto } from './dto/filter-service.dto';

// Mock para entidades
jest.mock(
  '../clients/entities/client.entity',
  () => ({
    Cliente: class Cliente {},
  }),
  { virtual: true },
);

jest.mock(
  './entities/service.entity',
  () => ({
    Service: class Service {},
  }),
  { virtual: true },
);

jest.mock(
  './entities/resource-assignment.entity',
  () => ({
    ResourceAssignment: class ResourceAssignment {},
  }),
  { virtual: true },
);

jest.mock(
  '../employees/entities/employee.entity',
  () => ({
    Empleado: class Empleado {},
  }),
  { virtual: true },
);

jest.mock(
  '../vehicles/entities/vehicle.entity',
  () => ({
    Vehicle: class Vehicle {},
  }),
  { virtual: true },
);

jest.mock(
  '../chemical_toilets/entities/chemical_toilet.entity',
  () => ({
    ChemicalToilet: class ChemicalToilet {},
  }),
  { virtual: true },
);

// Mock para JwtAuthGuard
jest.mock('src/auth/guards/jwt-auth.guard', () => ({
  JwtAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

// Mock para RolesGuard
jest.mock('src/roles/guards/roles.guard', () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

// Mock para MailerInterceptor
jest.mock('src/mailer/interceptor/mailer.interceptor', () => ({
  MailerInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn().mockImplementation((context, next) => next.handle()),
  })),
}));

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: ServicesService;

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
  };

  const mockVehiculo = {
    id: 1,
    placa: 'ABC123',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2023,
  };

  const mockBano = {
    baño_id: 1,
    codigo_interno: 'BQ-001',
    modelo: 'Standard',
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
  const mockServicesList = [
    mockService,
    {
      ...mockService,
      id: 2,
      tipoServicio: ServiceType.LIMPIEZA,
      fechaProgramada: new Date('2025-06-16T14:00:00.000Z'),
    } as unknown as Service,
  ];

  const mockPaginatedResult = {
    data: mockServicesList,
    totalItems: 2,
    currentPage: 1,
    totalPages: 1,
  };

  // Mock service
  const mockServicesService = {
    create: jest.fn().mockResolvedValue(mockService),
    findAll: jest.fn().mockResolvedValue(mockPaginatedResult),
    findOne: jest.fn().mockResolvedValue(mockService),
    findByDateRange: jest.fn().mockResolvedValue(mockServicesList),
    findToday: jest.fn().mockResolvedValue(mockServicesList),
    findByStatus: jest.fn().mockResolvedValue(mockServicesList),
    update: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        ...mockService,
        ...dto,
      }),
    ),
    remove: jest.fn().mockResolvedValue(undefined),
    changeStatus: jest.fn().mockImplementation((id, estado, comentario) =>
      Promise.resolve({
        ...mockService,
        estado,
        comentarioIncompleto: comentario,
      }),
    ),
  };

  beforeEach(async () => {
    console.log('======== PREPARANDO TESTS DE SERVICES CONTROLLER ========');

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<ServicesService>(ServicesService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    console.log('🧪 TEST: El controlador de servicios debería estar definido');
    expect(controller).toBeDefined();
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

      // Act
      const result = await controller.create(createServiceDto);

      // Assert
      expect(result).toEqual(mockService);
      expect(mockServicesService.create).toHaveBeenCalledWith(createServiceDto);
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
      const result = await controller.findAll(filterDto, page, limit);

      // Assert
      expect(result).toEqual(mockPaginatedResult);
      expect(mockServicesService.findAll).toHaveBeenCalledWith(
        filterDto,
        page,
        limit,
      );
    });

    it('should handle search filters', async () => {
      console.log('🧪 TEST: Debe manejar filtros de búsqueda');
      // Arrange
      const filterDto: FilterServicesDto = { search: 'instalación' };
      const page = 1;
      const limit = 10;

      // Act
      await controller.findAll(filterDto, page, limit);

      // Assert
      expect(mockServicesService.findAll).toHaveBeenCalledWith(
        filterDto,
        page,
        limit,
      );
    });

    it('should handle errors', async () => {
      console.log('🧪 TEST: Debe manejar errores');
      // Arrange
      mockServicesService.findAll.mockRejectedValue(
        new Error('Error de base de datos'),
      );

      // Act & Assert
      await expect(controller.findAll({}, 1, 10)).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('findByDateRange', () => {
    it('should return services in a date range', async () => {
      console.log('🧪 TEST: Debe retornar servicios en un rango de fechas');
      // Arrange
      const startDate = '2025-06-01';
      const endDate = '2025-06-30';

      // Act
      const result = await controller.findByDateRange(startDate, endDate);

      // Assert
      expect(result).toEqual(mockServicesList);
      expect(mockServicesService.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
    });
  });

  describe('findToday', () => {
    it('should return services for today', async () => {
      console.log('🧪 TEST: Debe retornar servicios para hoy');
      // Act
      const result = await controller.findToday();

      // Assert
      expect(result).toEqual(mockServicesList);
      expect(mockServicesService.findToday).toHaveBeenCalled();
    });
  });

  describe('findPending', () => {
    it('should return pending services', async () => {
      console.log('🧪 TEST: Debe retornar servicios pendientes');
      // Act
      const result = await controller.findPending();

      // Assert
      expect(result).toEqual(mockServicesList);
      expect(mockServicesService.findByStatus).toHaveBeenCalledWith(
        ServiceState.SUSPENDIDO,
      );
    });
  });

  describe('findInProgress', () => {
    it('should return in-progress services', async () => {
      console.log('🧪 TEST: Debe retornar servicios en progreso');
      // Act
      const result = await controller.findInProgress();

      // Assert
      expect(result).toEqual(mockServicesList);
      expect(mockServicesService.findByStatus).toHaveBeenCalledWith(
        ServiceState.EN_PROGRESO,
      );
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      console.log('🧪 TEST: Debe retornar un servicio por ID');
      // Arrange
      const id = 1;

      // Act
      const result = await controller.findOne(id);

      // Assert
      expect(result).toEqual(mockService);
      expect(mockServicesService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      console.log('🧪 TEST: Debe actualizar un servicio');
      // Arrange
      const id = 1;
      const updateServiceDto: UpdateServiceDto = {
        notas: 'Ubicación actualizada, entrada por el lateral',
        estado: ServiceState.EN_PROGRESO,
      };

      // Act
      const result = await controller.update(id, updateServiceDto);

      // Assert
      expect(result).toEqual({
        ...mockService,
        ...updateServiceDto,
      });
      expect(mockServicesService.update).toHaveBeenCalledWith(
        id,
        updateServiceDto,
      );
    });
  });

  describe('remove', () => {
    it('should remove a service', async () => {
      console.log('🧪 TEST: Debe eliminar un servicio');
      // Arrange
      const id = 1;

      // Act
      await controller.remove(id);

      // Assert
      expect(mockServicesService.remove).toHaveBeenCalledWith(id);
    });
  });

  describe('changeStatus', () => {
    it('should change a service status', async () => {
      console.log('🧪 TEST: Debe cambiar el estado de un servicio');
      // Arrange
      const id = 1;
      const statusDto: ChangeServiceStatusDto = {
        estado: ServiceState.COMPLETADO,
      };

      // Act
      const result = await controller.changeStatus(id, statusDto);

      // Assert
      expect(result).toEqual({
        ...mockService,
        estado: ServiceState.COMPLETADO,
        comentarioIncompleto: undefined,
      });
      expect(mockServicesService.changeStatus).toHaveBeenCalledWith(
        id,
        statusDto.estado,
        undefined,
      );
    });

    it('should validate estado is valid', async () => {
      console.log('🧪 TEST: Debe validar que el estado sea válido');
      // Arrange
      const id = 1;
      const statusDto = {
        estado: 'ESTADO_INVALIDO',
      } as any;

      // Act & Assert
      await expect(controller.changeStatus(id, statusDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockServicesService.changeStatus).not.toHaveBeenCalled();
    });

    it('should validate comentarioIncompleto is provided when estado is INCOMPLETO', async () => {
      console.log(
        '🧪 TEST: Debe validar que se proporcione un comentario cuando el estado es INCOMPLETO',
      );
      // Arrange
      const id = 1;
      const statusDto: ChangeServiceStatusDto = {
        estado: ServiceState.INCOMPLETO,
      };

      // Act & Assert
      await expect(controller.changeStatus(id, statusDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockServicesService.changeStatus).not.toHaveBeenCalled();
    });

    it('should accept comentarioIncompleto when estado is INCOMPLETO', async () => {
      console.log(
        '🧪 TEST: Debe aceptar un comentario cuando el estado es INCOMPLETO',
      );
      // Arrange
      const id = 1;
      const statusDto: ChangeServiceStatusDto = {
        estado: ServiceState.INCOMPLETO,
        comentarioIncompleto: 'No se completó por mal clima',
      };

      // Act
      const result = await controller.changeStatus(id, statusDto);

      // Assert
      expect(result).toEqual({
        ...mockService,
        estado: ServiceState.INCOMPLETO,
        comentarioIncompleto: 'No se completó por mal clima',
      });
      expect(mockServicesService.changeStatus).toHaveBeenCalledWith(
        id,
        statusDto.estado,
        statusDto.comentarioIncompleto,
      );
    });
  });
});
