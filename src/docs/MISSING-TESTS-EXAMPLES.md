# Implementación de Tests Faltantes: Ejemplos Prácticos

Este documento proporciona ejemplos concretos para implementar los tipos de tests identificados como faltantes en la aplicación MVA-Backend. El objetivo es ofrecer una guía práctica que pueda seguirse para mejorar la cobertura y calidad de los tests.

## Índice

1. [Tests de Integración](#tests-de-integración)
2. [Tests E2E](#tests-e2e)
3. [Tests para Guards](#tests-para-guards)
4. [Tests para Pipes](#tests-para-pipes)
5. [Tests para Interceptors](#tests-para-interceptors)
6. [Tests para DTOs](#tests-para-dtos)
7. [Tests de Rendimiento](#tests-de-rendimiento)

## Tests de Integración

### Ejemplo: Integración de Servicios y Recursos

El siguiente ejemplo muestra cómo probar la integración entre el servicio de servicios y la asignación de recursos (empleados, vehículos y baños).

```typescript
// src/services/integration/services-resources.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from '../services.service';
import { EmployeesService } from '../../employees/employees.service';
import { VehiclesService } from '../../vehicles/vehicles.service';
import { ChemicalToiletsService } from '../../chemical_toilets/chemical_toilets.service';
import { Service } from '../entities/service.entity';
import { ResourceAssignment } from '../entities/resource-assignment.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../../chemical_toilets/entities/chemical_toilet.entity';
import {
  ServiceType,
  ResourceState,
} from '../../common/enums/resource-states.enum';

describe('ServicesResourcesIntegration', () => {
  let module: TestingModule;
  let servicesService: ServicesService;
  let employeesService: EmployeesService;
  let vehiclesService: VehiclesService;
  let toiletsService: ChemicalToiletsService;

  beforeAll(async () => {
    // Configurar un módulo que incluya los servicios reales y una base de datos en memoria
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Service,
            ResourceAssignment,
            Employee,
            Vehicle,
            ChemicalToilet,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          Service,
          ResourceAssignment,
          Employee,
          Vehicle,
          ChemicalToilet,
        ]),
      ],
      providers: [
        ServicesService,
        EmployeesService,
        VehiclesService,
        ChemicalToiletsService,
      ],
    }).compile();

    servicesService = module.get<ServicesService>(ServicesService);
    employeesService = module.get<EmployeesService>(EmployeesService);
    vehiclesService = module.get<VehiclesService>(VehiclesService);
    toiletsService = module.get<ChemicalToiletsService>(ChemicalToiletsService);

    // Inicializar la base de datos con datos de prueba
    await setupTestData();
  });

  afterAll(async () => {
    await module.close();
  });

  async function setupTestData() {
    // Crear empleados
    await employeesService.create({
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      estado: ResourceState.DISPONIBLE,
      // ... otros campos requeridos
    });
    await employeesService.create({
      nombre: 'María',
      apellido: 'Gómez',
      email: 'maria@example.com',
      estado: ResourceState.DISPONIBLE,
      // ... otros campos requeridos
    });

    // Crear vehículos
    await vehiclesService.create({
      placa: 'ABC123',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2023,
      estado: ResourceState.DISPONIBLE,
      // ... otros campos requeridos
    });

    // Crear baños químicos
    await toiletsService.create({
      codigo_interno: 'BQ-001',
      modelo: 'Standard',
      estado: ResourceState.DISPONIBLE,
      // ... otros campos requeridos
    });
    await toiletsService.create({
      codigo_interno: 'BQ-002',
      modelo: 'Premium',
      estado: ResourceState.DISPONIBLE,
      // ... otros campos requeridos
    });
  }

  it('debe asignar recursos correctamente al crear un servicio con asignación automática', async () => {
    // Arrange
    const createServiceDto = {
      clienteId: 1,
      fechaProgramada: new Date('2025-06-15T09:00:00.000Z'),
      tipoServicio: ServiceType.INSTALACION,
      cantidadBanos: 2,
      cantidadVehiculos: 1,
      ubicacion: 'Av. Rivadavia 1234, CABA',
      asignacionAutomatica: true,
    };

    // Act
    const createdService = await servicesService.create(createServiceDto);

    // Assert
    expect(createdService.id).toBeDefined();

    // Verificar que se crearon las asignaciones de recursos
    const service = await servicesService.findOne(createdService.id);
    expect(service.asignaciones.length).toBeGreaterThan(0);

    // Verificar que los empleados fueron asignados
    const assignedEmployees = service.asignaciones
      .filter((a) => a.empleadoId)
      .map((a) => a.empleadoId);
    expect(assignedEmployees.length).toBeGreaterThan(0);

    // Verificar que los vehículos fueron asignados
    const assignedVehicles = service.asignaciones
      .filter((a) => a.vehiculoId)
      .map((a) => a.vehiculoId);
    expect(assignedVehicles.length).toBe(1);

    // Verificar que los baños fueron asignados
    const assignedToilets = service.asignaciones
      .filter((a) => a.banoId)
      .map((a) => a.banoId);
    expect(assignedToilets.length).toBe(2);

    // Verificar que los recursos cambiaron de estado a ASIGNADO
    for (const empleadoId of assignedEmployees) {
      const employee = await employeesService.findOne(empleadoId);
      expect(employee.estado).toBe(ResourceState.ASIGNADO);
    }

    for (const vehiculoId of assignedVehicles) {
      const vehicle = await vehiclesService.findOne(vehiculoId);
      expect(vehicle.estado).toBe(ResourceState.ASIGNADO);
    }

    for (const banoId of assignedToilets) {
      const toilet = await toiletsService.findOne(banoId);
      expect(toilet.estado).toBe(ResourceState.ASIGNADO);
    }
  });

  it('debe liberar recursos correctamente al eliminar un servicio', async () => {
    // Arrange - Crear un servicio con asignación automática
    const createServiceDto = {
      clienteId: 1,
      fechaProgramada: new Date('2025-07-15T09:00:00.000Z'),
      tipoServicio: ServiceType.INSTALACION,
      cantidadBanos: 1,
      cantidadVehiculos: 1,
      ubicacion: 'Otra ubicación',
      asignacionAutomatica: true,
    };

    const createdService = await servicesService.create(createServiceDto);

    // Capturar IDs de recursos asignados para verificar después
    const service = await servicesService.findOne(createdService.id);
    const assignedEmployeeIds = service.asignaciones
      .filter((a) => a.empleadoId)
      .map((a) => a.empleadoId);
    const assignedVehicleIds = service.asignaciones
      .filter((a) => a.vehiculoId)
      .map((a) => a.vehiculoId);
    const assignedToiletIds = service.asignaciones
      .filter((a) => a.banoId)
      .map((a) => a.banoId);

    // Act - Eliminar el servicio
    await servicesService.remove(createdService.id);

    // Assert - Verificar que los recursos fueron liberados (volvieron a DISPONIBLE)
    for (const empleadoId of assignedEmployeeIds) {
      const employee = await employeesService.findOne(empleadoId);
      expect(employee.estado).toBe(ResourceState.DISPONIBLE);
    }

    for (const vehiculoId of assignedVehicleIds) {
      const vehicle = await vehiclesService.findOne(vehiculoId);
      expect(vehicle.estado).toBe(ResourceState.DISPONIBLE);
    }

    for (const banoId of assignedToiletIds) {
      const toilet = await toiletsService.findOne(banoId);
      expect(toilet.estado).toBe(ResourceState.DISPONIBLE);
    }
  });
});
```

## Tests E2E

### Ejemplo: Flujo Completo de Gestión de Servicios

Este test E2E comprueba el flujo completo de creación, lectura, actualización, cambio de estado y eliminación de un servicio mediante la API REST.

```typescript
// test/services.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  ServiceType,
  ServiceState,
} from '../src/common/enums/resource-states.enum';

describe('ServicesController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdServiceId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Aplicar los mismos pipes, filters, etc. que en la aplicación real
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Obtener un token de autenticación
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin', // Usar credenciales de prueba
        password: 'admin',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('01. Debe crear un nuevo servicio', async () => {
    const createServiceDto = {
      clienteId: 1,
      fechaProgramada: new Date('2025-06-15T09:00:00.000Z').toISOString(),
      tipoServicio: ServiceType.INSTALACION,
      cantidadBanos: 2,
      cantidadVehiculos: 1,
      ubicacion: 'Av. Rivadavia 1234, CABA',
      asignacionAutomatica: true,
    };

    const response = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createServiceDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    createdServiceId = response.body.id;

    // Verificar otras propiedades
    expect(response.body.tipoServicio).toBe(ServiceType.INSTALACION);
    expect(response.body.cantidadBanos).toBe(2);
    expect(response.body.cantidadVehiculos).toBe(1);
    expect(response.body.ubicacion).toBe('Av. Rivadavia 1234, CABA');
    expect(response.body.estado).toBe(ServiceState.PROGRAMADO);
  });

  it('02. Debe obtener el servicio creado por su ID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(createdServiceId);
    expect(response.body).toHaveProperty('asignaciones');
    expect(Array.isArray(response.body.asignaciones)).toBe(true);
  });

  it('03. Debe listar servicios con paginación', async () => {
    const response = await request(app.getHttpServer())
      .get('/services')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('totalItems');
    expect(response.body).toHaveProperty('currentPage');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('04. Debe actualizar un servicio', async () => {
    const updateServiceDto = {
      notas: 'Notas actualizadas para el test e2e',
      ubicacion: 'Ubicación actualizada para el test',
    };

    const response = await request(app.getHttpServer())
      .patch(`/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateServiceDto)
      .expect(200);

    expect(response.body.id).toBe(createdServiceId);
    expect(response.body.notas).toBe(updateServiceDto.notas);
    expect(response.body.ubicacion).toBe(updateServiceDto.ubicacion);
  });

  it('05. Debe cambiar el estado de un servicio', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/services/${createdServiceId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        estado: ServiceState.EN_PROGRESO,
      })
      .expect(200);

    expect(response.body.id).toBe(createdServiceId);
    expect(response.body.estado).toBe(ServiceState.EN_PROGRESO);
  });

  it('06. Debe marcar un servicio como INCOMPLETO con comentario', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/services/${createdServiceId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        estado: ServiceState.INCOMPLETO,
        comentarioIncompleto: 'No se pudo completar por mal clima',
      })
      .expect(200);

    expect(response.body.id).toBe(createdServiceId);
    expect(response.body.estado).toBe(ServiceState.INCOMPLETO);
    expect(response.body.comentarioIncompleto).toBe(
      'No se pudo completar por mal clima',
    );
  });

  it('07. Debe rechazar cambio a INCOMPLETO sin comentario', async () => {
    await request(app.getHttpServer())
      .patch(`/services/${createdServiceId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        estado: ServiceState.INCOMPLETO,
        // Sin comentarioIncompleto
      })
      .expect(400); // Bad Request
  });

  it('08. Debe marcar un servicio como COMPLETADO', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/services/${createdServiceId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        estado: ServiceState.COMPLETADO,
      })
      .expect(200);

    expect(response.body.id).toBe(createdServiceId);
    expect(response.body.estado).toBe(ServiceState.COMPLETADO);
  });

  it('09. Debe eliminar un servicio', async () => {
    await request(app.getHttpServer())
      .delete(`/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verificar que el servicio ya no existe
    await request(app.getHttpServer())
      .get(`/services/${createdServiceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
```

## Tests para Guards

### Ejemplo: Test para JwtAuthGuard

```typescript
// src/auth/guards/jwt-auth.guard.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createMock } from '@golevelup/ts-jest';
import { Reflector } from '@nestjs/core';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('debe permitir acceso con token válido', async () => {
    // Arrange
    const mockContext = createMock<ExecutionContext>();
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid_token',
      },
    };

    mockContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
    (jwtService.verify as jest.Mock).mockReturnValue({
      sub: 1,
      username: 'test',
      roles: ['admin'],
    });

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true);
    expect(mockRequest).toHaveProperty('user');
    expect(mockRequest.user).toEqual({
      sub: 1,
      username: 'test',
      roles: ['admin'],
    });
  });

  it('debe rechazar acceso sin token', async () => {
    // Arrange
    const mockContext = createMock<ExecutionContext>();
    const mockRequest = {
      headers: {},
    };

    mockContext.switchToHttp().getRequest.mockReturnValue(mockRequest);

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow();
  });

  it('debe rechazar acceso con token inválido', async () => {
    // Arrange
    const mockContext = createMock<ExecutionContext>();
    const mockRequest = {
      headers: {
        authorization: 'Bearer invalid_token',
      },
    };

    mockContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow();
  });

  it('debe omitir la verificación para rutas públicas', async () => {
    // Arrange
    const mockContext = createMock<ExecutionContext>();
    const mockRequest = {
      headers: {},
    };

    mockContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
    const reflector = module.get<Reflector>(Reflector);
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true); // Simula la ruta pública

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true);
  });
});
```

## Tests para Pipes

### Ejemplo: Test para ValidationPipe Personalizado

```typescript
// src/common/pipes/validation.pipe.spec.ts
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ValidationPipe } from './validation.pipe';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

// Clase de ejemplo para probar el pipe
class TestDto {
  name: string;
  age: number;
}

jest.mock('class-validator');
jest.mock('class-transformer');

describe('ValidationPipe', () => {
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    validationPipe = new ValidationPipe();
    (validate as jest.Mock).mockClear();
    (plainToClass as jest.Mock).mockClear();
  });

  it('debe pasar validación si no hay errores', async () => {
    // Arrange
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: TestDto,
    };
    const value = { name: 'Test', age: 30 };

    (plainToClass as jest.Mock).mockReturnValue(value);
    (validate as jest.Mock).mockResolvedValue([]);

    // Act
    const result = await validationPipe.transform(value, metadata);

    // Assert
    expect(result).toEqual(value);
    expect(plainToClass).toHaveBeenCalledWith(TestDto, value);
    expect(validate).toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si hay errores de validación', async () => {
    // Arrange
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: TestDto,
    };
    const value = { name: '', age: 'not-a-number' };

    const mockErrors = [
      {
        property: 'name',
        constraints: { isNotEmpty: 'name should not be empty' },
      },
      {
        property: 'age',
        constraints: { isNumber: 'age must be a number' },
      },
    ];

    (plainToClass as jest.Mock).mockReturnValue(value);
    (validate as jest.Mock).mockResolvedValue(mockErrors);

    // Act & Assert
    await expect(validationPipe.transform(value, metadata)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe devolver el valor sin transformación si metatype no está definido', async () => {
    // Arrange
    const metadata: ArgumentMetadata = {
      type: 'body',
    };
    const value = { name: 'Test', age: 30 };

    // Act
    const result = await validationPipe.transform(value, metadata);

    // Assert
    expect(result).toEqual(value);
    expect(plainToClass).not.toHaveBeenCalled();
    expect(validate).not.toHaveBeenCalled();
  });
});
```

## Tests para Interceptors

### Ejemplo: Test para LoggingInterceptor

```typescript
// src/common/interceptors/logging.interceptor.spec.ts
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { createMock } from '@golevelup/ts-jest';
import { of } from 'rxjs';
import { Logger } from '@nestjs/common';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
    logger.log = jest.fn();
    logger.error = jest.fn();

    interceptor = new LoggingInterceptor();
    (interceptor as any).logger = logger; // Inyectar el mock logger
  });

  it('debe registrar el inicio y fin de la petición', (done) => {
    // Arrange
    const mockContext = createMock<ExecutionContext>();
    const mockHandler = createMock<CallHandler>();

    mockContext.switchToHttp().getRequest.mockReturnValue({
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
    });

    mockHandler.handle.mockReturnValue(of({ data: 'test' }));

    // Act
    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: (data) => {
        // Assert
        expect(data).toEqual({ data: 'test' });
        expect(logger.log).toHaveBeenCalledTimes(2);
        expect((logger.log as jest.Mock).mock.calls[0][0]).toContain(
          'Incoming Request',
        );
        expect((logger.log as jest.Mock).mock.calls[1][0]).toContain(
          'Response',
        );
        done();
      },
    });
  });

  it('debe registrar errores', (done) => {
    // Arrange
    const mockContext = createMock<ExecutionContext>();
    const mockHandler = createMock<CallHandler>();
    const testError = new Error('Test error');

    mockContext.switchToHttp().getRequest.mockReturnValue({
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
    });

    mockHandler.handle.mockReturnValue({
      subscribe: (observer) => {
        observer.error(testError);
        return { unsubscribe: jest.fn() };
      },
    });

    // Act
    interceptor.intercept(mockContext, mockHandler).subscribe({
      error: (error) => {
        // Assert
        expect(error).toBe(testError);
        expect(logger.log).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Request Error'),
          testError.stack,
        );
        done();
      },
    });
  });
});
```

## Tests para DTOs

### Ejemplo: Test para CreateServiceDto

```typescript
// src/services/dto/create-service.dto.spec.ts
import { validate } from 'class-validator';
import { CreateServiceDto } from './create-service.dto';
import { ServiceType } from '../../common/enums/resource-states.enum';

describe('CreateServiceDto', () => {
  it('debe validar un DTO válido', async () => {
    // Arrange
    const dto = new CreateServiceDto();
    dto.clienteId = 1;
    dto.fechaProgramada = new Date('2025-06-15T09:00:00.000Z');
    dto.tipoServicio = ServiceType.INSTALACION;
    dto.cantidadBanos = 2;
    dto.cantidadVehiculos = 1;
    dto.ubicacion = 'Av. Rivadavia 1234, CABA';
    dto.asignacionAutomatica = true;

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBe(0);
  });

  it('debe requerir clienteId', async () => {
    // Arrange
    const dto = new CreateServiceDto();
    dto.fechaProgramada = new Date('2025-06-15T09:00:00.000Z');
    dto.tipoServicio = ServiceType.INSTALACION;
    dto.cantidadBanos = 2;
    dto.cantidadVehiculos = 1;
    dto.ubicacion = 'Av. Rivadavia 1234, CABA';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const clienteIdErrors = errors.find((err) => err.property === 'clienteId');
    expect(clienteIdErrors).toBeDefined();
  });

  it('debe requerir fechaProgramada', async () => {
    // Arrange
    const dto = new CreateServiceDto();
    dto.clienteId = 1;
    dto.tipoServicio = ServiceType.INSTALACION;
    dto.cantidadBanos = 2;
    dto.cantidadVehiculos = 1;
    dto.ubicacion = 'Av. Rivadavia 1234, CABA';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const fechaErrors = errors.find(
      (err) => err.property === 'fechaProgramada',
    );
    expect(fechaErrors).toBeDefined();
  });

  it('debe validar cantidadBanos mínima para INSTALACION', async () => {
    // Arrange
    const dto = new CreateServiceDto();
    dto.clienteId = 1;
    dto.fechaProgramada = new Date('2025-06-15T09:00:00.000Z');
    dto.tipoServicio = ServiceType.INSTALACION;
    dto.cantidadBanos = 0; // Inválido
    dto.cantidadVehiculos = 1;
    dto.ubicacion = 'Av. Rivadavia 1234, CABA';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const banosErrors = errors.find((err) => err.property === 'cantidadBanos');
    expect(banosErrors).toBeDefined();
  });

  it('debe validar cantidadBanos mínima para CAPACITACION', async () => {
    // Arrange
    const dto = new CreateServiceDto();
    dto.clienteId = 1;
    dto.fechaProgramada = new Date('2025-06-15T09:00:00.000Z');
    dto.tipoServicio = ServiceType.CAPACITACION;
    dto.cantidadBanos = 1; // Menos de lo requerido para CAPACITACION
    dto.cantidadVehiculos = 1;
    dto.ubicacion = 'Av. Rivadavia 1234, CABA';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const banosErrors = errors.find((err) => err.property === 'cantidadBanos');
    expect(banosErrors).toBeDefined();
  });

  it('debe validar cantidadVehiculos', async () => {
    // Arrange
    const dto = new CreateServiceDto();
    dto.clienteId = 1;
    dto.fechaProgramada = new Date('2025-06-15T09:00:00.000Z');
    dto.tipoServicio = ServiceType.INSTALACION;
    dto.cantidadBanos = 2;
    dto.cantidadVehiculos = 0; // Inválido
    dto.ubicacion = 'Av. Rivadavia 1234, CABA';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const vehiculosErrors = errors.find(
      (err) => err.property === 'cantidadVehiculos',
    );
    expect(vehiculosErrors).toBeDefined();
  });
});
```

## Tests de Rendimiento

### Ejemplo: Test de Carga para Servicios

```typescript
// test/performance/services.performance.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ServiceType } from '../../src/common/enums/resource-states.enum';

describe('Services API Performance', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Obtener token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('debe manejar 100 consultas simultáneas', async () => {
    // Preparar 100 promesas para consultas simultáneas
    const promises = [];
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app.getHttpServer())
          .get('/services')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: 1, limit: 10 }),
      );
    }

    // Ejecutar todas las consultas
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Verificar que todas las consultas fueron exitosas
    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    }

    // Calcular estadísticas
    console.log(`Total tiempo para 100 consultas: ${totalTime}ms`);
    console.log(`Tiempo promedio por consulta: ${totalTime / 100}ms`);

    // Verificar que el tiempo total no exceda un límite razonable (ajustar según necesidades)
    expect(totalTime).toBeLessThan(10000); // 10 segundos para 100 consultas
  });

  it('debe manejar la creación masiva de servicios', async () => {
    // Crear múltiples servicios en secuencia y medir tiempo
    const numServices = 10;
    const createPromises = [];
    const startTime = Date.now();

    for (let i = 0; i < numServices; i++) {
      const createServiceDto = {
        clienteId: 1,
        fechaProgramada: new Date(
          `2025-06-${15 + i}T09:00:00.000Z`,
        ).toISOString(),
        tipoServicio: ServiceType.INSTALACION,
        cantidadBanos: 1,
        cantidadVehiculos: 1,
        ubicacion: `Ubicación test ${i}`,
        asignacionAutomatica: true,
      };

      createPromises.push(
        request(app.getHttpServer())
          .post('/services')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createServiceDto),
      );
    }

    // Ejecutar creaciones
    const responses = await Promise.all(createPromises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Verificar resultados
    for (const response of responses) {
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    }

    // Calcular estadísticas
    console.log(
      `Total tiempo para crear ${numServices} servicios: ${totalTime}ms`,
    );
    console.log(`Tiempo promedio por creación: ${totalTime / numServices}ms`);

    // Verificar tiempo razonable (ajustar según complejidad real)
    expect(totalTime).toBeLessThan(numServices * 1000); // 1 segundo por servicio como máximo
  });
});
```

Estos ejemplos proporcionan una base sólida para implementar los tipos de tests que faltan en la aplicación. Cada ejemplo incluye explicaciones detalladas y está estructurado siguiendo las mejores prácticas de testing en NestJS.
