# Guía de Implementación de Tests

Este documento proporciona guías prácticas para implementar diferentes tipos de tests en el proyecto MVA-Backend, con ejemplos concretos basados en el código existente.

## Índice

1. [Tests Unitarios](#tests-unitarios)
2. [Tests de Integración](#tests-de-integración)
3. [Tests E2E](#tests-e2e)
4. [Mocks](#mocks)
5. [Patrones Comunes](#patrones-comunes)

## Tests Unitarios

### Tests de Servicios

Los tests de servicios deben probar la lógica de negocio de manera aislada, mockeando todas las dependencias externas.

#### Estructura Recomendada

```typescript
describe('MiServicio', () => {
  let service: MiServicio;
  let mockDependencia1: jest.Mocked<Dependencia1>;
  let mockDependencia2: jest.Mocked<Dependencia2>;

  // Mock data - Definir datos mock reutilizables
  const mockEntidad = {
    /* ... */
  };

  beforeEach(async () => {
    // Configurar mocks
    mockDependencia1 = { metodo1: jest.fn(), metodo2: jest.fn() };
    mockDependencia2 = { metodo1: jest.fn(), metodo2: jest.fn() };

    // Configurar módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MiServicio,
        { provide: Dependencia1, useValue: mockDependencia1 },
        { provide: Dependencia2, useValue: mockDependencia2 },
      ],
    }).compile();

    service = module.get<MiServicio>(MiServicio);
  });

  // Test de métodos
  describe('metodoA', () => {
    it('debe hacer X cuando Y', async () => {
      // Arrange - Preparar la prueba
      mockDependencia1.metodo1.mockResolvedValue(/* resultado esperado */);

      // Act - Ejecutar el método bajo prueba
      const resultado = await service.metodoA(/* parámetros */);

      // Assert - Verificar el resultado
      expect(resultado).toEqual(/* resultado esperado */);
      expect(
        mockDependencia1.metodo1,
      ).toHaveBeenCalledWith(/* parámetros esperados */);
    });

    it('debe manejar errores correctamente', async () => {
      // Arrange - Preparar con error
      mockDependencia1.metodo1.mockRejectedValue(new Error('Error test'));

      // Act & Assert - Ejecutar y verificar excepción
      await expect(
        service.metodoA(/* parámetros */),
      ).rejects.toThrow(/* tipo de error */);
    });
  });
});
```

#### Ejemplo Real: ServicesService

El test del servicio de servicios (`services.service.spec.ts`) es un buen ejemplo de cómo estructurar tests complejos:

```typescript
describe('ServicesService', () => {
  // Preparación de mocks, datos y configuración del módulo...

  describe('create', () => {
    it('should create a new service', async () => {
      // Arrange - Preparación del escenario
      const createServiceDto: CreateServiceDto = {
        clienteId: 1,
        fechaProgramada: new Date('2025-06-15T09:00:00.000Z'),
        tipoServicio: ServiceType.INSTALACION,
        // ...otros campos
      };

      // Mock de métodos internos
      jest
        .spyOn(service as any, 'verifyResourcesAvailability')
        .mockResolvedValue(true);
      jest
        .spyOn(service as any, 'assignResourcesAutomatically')
        .mockResolvedValue(true);

      // Act - Ejecución del método a probar
      const result = await service.create(createServiceDto);

      // Assert - Verificaciones del comportamiento y resultado
      expect(result).toEqual(mockService);
      expect(mockDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    // Más tests para otras situaciones...
  });

  // Más describes para otros métodos...
});
```

### Tests de Controladores

Los tests de controladores deben probar que:

1. Los endpoints reciban correctamente los parámetros
2. Se llame al servicio con los parámetros correctos
3. Se devuelva la respuesta HTTP apropiada

#### Estructura Recomendada

```typescript
describe('MiControlador', () => {
  let controller: MiControlador;
  let miServicio: jest.Mocked<MiServicio>;

  beforeEach(async () => {
    // Configurar mocks
    miServicio = {
      metodoA: jest.fn(),
      metodoB: jest.fn(),
    } as unknown as jest.Mocked<MiServicio>;

    // Configurar módulo de testing
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MiControlador],
      providers: [{ provide: MiServicio, useValue: miServicio }],
    }).compile();

    controller = module.get<MiControlador>(MiControlador);
  });

  describe('endpoint1', () => {
    it('debe devolver X cuando se llama con Y', async () => {
      // Arrange
      const mockRequest = { param1: 'valor1' };
      const mockResponse = { data: 'resultado' };
      miServicio.metodoA.mockResolvedValue(mockResponse);

      // Act
      const resultado = await controller.endpoint1(mockRequest);

      // Assert
      expect(resultado).toEqual(mockResponse);
      expect(miServicio.metodoA).toHaveBeenCalledWith(mockRequest.param1);
    });

    // Más tests para otras situaciones...
  });
});
```

#### Ejemplo Real: ServicesController

```typescript
describe('ServicesController', () => {
  let controller: ServicesController;
  let servicesService: jest.Mocked<ServicesService>;

  beforeEach(async () => {
    // Setup mock service
    servicesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      // ...otros métodos
    } as unknown as jest.Mocked<ServicesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: servicesService }],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  describe('create', () => {
    it('should create a new service', async () => {
      // Arrange
      const createServiceDto = {
        /* ...datos */
      };
      const expectedResult = {
        /* ...resultado esperado */
      };
      servicesService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createServiceDto);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(servicesService.create).toHaveBeenCalledWith(createServiceDto);
    });
  });

  // Más tests para otros endpoints...
});
```

## Tests de Integración

Los tests de integración prueban cómo interactúan varios componentes entre sí, sin mockear todas las dependencias.

### Ejemplo Básico

```typescript
describe('Integración: Services y Assignments', () => {
  let module: TestingModule;
  let servicesService: ServicesService;
  let assignmentRepository: Repository<ResourceAssignment>;

  beforeEach(async () => {
    // Configurar módulo con componentes reales (menos bases de datos)
    module = await Test.createTestingModule({
      imports: [
        // Importar módulos reales o TestingModule
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            /* entidades */
          ],
          synchronize: true,
        }),
        ServicesModule,
        // Otros módulos relacionados
      ],
    }).compile();

    servicesService = module.get<ServicesService>(ServicesService);
    assignmentRepository = module.get<Repository<ResourceAssignment>>(
      getRepositoryToken(ResourceAssignment),
    );
  });

  it('debe crear un servicio y las asignaciones correspondientes', async () => {
    // Arrange
    const createServiceDto = {
      /* datos de prueba */
    };

    // Act
    const result = await servicesService.create(createServiceDto);

    // Assert
    // Verificar que se creó el servicio
    expect(result.id).toBeDefined();

    // Verificar integraciones - por ejemplo, que se crearon las asignaciones
    const assignments = await assignmentRepository.find({
      where: { servicioId: result.id },
    });
    expect(assignments.length).toBeGreaterThan(0);
  });
});
```

## Tests E2E

Los tests E2E prueban la aplicación completa, simulando la interacción real de un usuario.

### Estructura Recomendada

```typescript
describe('Módulo E2E', () => {
  let app: INestApplication;
  let token: string; // Para autenticación

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Usar el módulo completo
    }).compile();

    app = moduleFixture.createNestApplication();
    // Aplicar middleware, pipes, etc. como en la app real
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Autenticar si es necesario
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' });

    token = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CRUD Completo', () => {
    it('debe completar el flujo CRUD', async () => {
      // 1. Crear
      const createResponse = await request(app.getHttpServer())
        .post('/ruta')
        .set('Authorization', `Bearer ${token}`)
        .send({
          /* datos */
        });

      expect(createResponse.status).toBe(201);
      const createdId = createResponse.body.id;

      // 2. Leer
      const getResponse = await request(app.getHttpServer())
        .get(`/ruta/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.id).toEqual(createdId);

      // 3. Actualizar
      const updateResponse = await request(app.getHttpServer())
        .patch(`/ruta/${createdId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          /* datos actualizados */
        });

      expect(updateResponse.status).toBe(200);

      // 4. Eliminar
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/ruta/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);

      // 5. Verificar eliminación
      const getFinalResponse = await request(app.getHttpServer())
        .get(`/ruta/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getFinalResponse.status).toBe(404);
    });
  });
});
```

## Mocks

### Patrones para Crear Mocks Efectivos

#### 1. Factory Functions para Datos Mock

```typescript
// En un archivo mock-factories.ts o dentro del test
function createMockEmployee(override: Partial<Employee> = {}): Employee {
  return {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@example.com',
    estado: ResourceState.DISPONIBLE,
    // ...otras propiedades por defecto
    ...override, // Permite sobrescribir propiedades específicas
  };
}

// Uso
const activeEmployee = createMockEmployee();
const inactiveEmployee = createMockEmployee({
  estado: ResourceState.NO_DISPONIBLE,
  id: 2,
});
```

#### 2. Mock de Repositorios TypeORM

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([
      [
        /* datos */
      ],
      10,
    ]),
  })),
};
```

#### 3. Mock de Métodos Privados con Jest spyOn

```typescript
// Para métodos privados o protegidos
jest
  .spyOn(service as any, 'privateMethod')
  .mockImplementation(() => 'mocked result');

// Para métodos asíncronos
jest
  .spyOn(service as any, 'asyncPrivateMethod')
  .mockResolvedValue('mocked result');
```

## Patrones Comunes

### Patrón: Arrange-Act-Assert (AAA)

```typescript
it('should do something', async () => {
  // Arrange - Preparar el test
  const input = {
    /* datos de entrada */
  };
  dependencia.metodo.mockResolvedValue(/* valor esperado */);

  // Act - Ejecutar el código a probar
  const result = await target.metodo(input);

  // Assert - Verificar el resultado
  expect(result).toEqual(/* valor esperado */);
  expect(dependencia.metodo).toHaveBeenCalledWith(/* parámetros esperados */);
});
```

### Patrón: Before/After Hooks

```typescript
describe('Mi Suite', () => {
  // Configuración global
  let service: MiServicio;

  // beforeAll: una vez antes de todos los tests
  beforeAll(() => {
    // Setup de recursos costosos (conexiones, etc.)
  });

  // beforeEach: antes de cada test
  beforeEach(() => {
    // Reiniciar estado, crear instancias frescas
    jest.clearAllMocks(); // Limpiar contadores y comportamientos de mocks
  });

  // afterEach: después de cada test
  afterEach(() => {
    // Limpiar cambios específicos
  });

  // afterAll: una vez después de todos los tests
  afterAll(() => {
    // Limpiar recursos costosos
  });

  // Tests...
});
```

### Patrón: Datos Parametrizados

```typescript
// Con array de casos
describe('validación', () => {
  const casos = [
    { input: 'valor1', expected: true, descripcion: 'valor válido' },
    { input: '', expected: false, descripcion: 'valor vacío' },
    // Más casos...
  ];

  test.each(casos)('debe validar $descripcion', ({ input, expected }) => {
    expect(servicio.validar(input)).toBe(expected);
  });
});
```

### Patrón: Compartir Configuración Entre Tests

```typescript
// setupTests.ts o similar
export function createTestingModuleForService(
  service: any,
  providers: Provider[] = [],
) {
  return Test.createTestingModule({
    providers: [
      service,
      // Mocks comunes
      { provide: getRepositoryToken(Entity), useValue: mockRepository },
      // Providers adicionales específicos del test
      ...providers,
    ],
  }).compile();
}

// En un test
describe('MiServicio', () => {
  beforeEach(async () => {
    const module = await createTestingModuleForService(MiServicio, [
      // Providers específicos para este test
    ]);
    service = module.get<MiServicio>(MiServicio);
  });
});
```
