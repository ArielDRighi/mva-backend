# Documentación de Testing para MVA-Backend

## Índice

1. [Introducción](#introducción)
2. [Estructura de Tests](#estructura-de-tests)
3. [Tipos de Tests por Módulo](#tipos-de-tests-por-módulo)
4. [Detalles de los Tests por Módulo](#detalles-de-los-tests-por-módulo)
5. [Ejecución de Tests](#ejecución-de-tests)
6. [Mocks](#mocks)
7. [Recomendaciones y Mejoras](#recomendaciones-y-mejoras)

## Introducción

El proyecto MVA-Backend implementa una estrategia de testing principalmente centrada en pruebas unitarias utilizando Jest como framework de testing. La mayoría de los módulos cuenta con tests para sus servicios y controladores, aunque con distinto nivel de cobertura. Este documento pretende servir como guía para entender la estructura de tests actual, cómo ejecutarlos y qué mejoras podrían implementarse.

## Estructura de Tests

La estructura de tests de la aplicación sigue los siguientes patrones:

1. **Tests Unitarios**:

   - Ubicados junto al código fuente con extensión `.spec.ts`
   - Principalmente enfocados en servicios y controladores
   - Utilizan mocks intensivamente para aislar la unidad bajo prueba

2. **Tests de Integración (E2E)**:

   - Ubicados en la carpeta `/test` con extensión `.e2e-spec.ts`
   - Actualmente muy limitados (solo un test básico para `AppController`)

3. **Estructura de Mocks**:
   - Mocks globales en la carpeta `/__mocks__` en la raíz
   - Mocks específicos por módulo en `/src/[module]/__mocks__`

## Tipos de Tests por Módulo

| Módulo                 | Tests Unitarios | Tests de Integración | Componentes Testeados |
| ---------------------- | --------------- | -------------------- | --------------------- |
| app                    | ✅              | ✅                   | Controller            |
| auth                   | ✅              | ❌                   | Controller, Service   |
| chemical_toilets       | ✅              | ❌                   | Controller, Service   |
| clients                | ✅              | ❌                   | Controller, Service   |
| clients_portal         | ✅              | ❌                   | Controller, Service   |
| clothing               | ✅              | ❌                   | Controller, Service   |
| contractual_conditions | ✅              | ❌                   | Controller, Service   |
| employees              | ✅              | ❌                   | Controller, Service   |
| employee_leaves        | ✅              | ❌                   | Controller, Service   |
| future_cleanings       | ✅              | ❌                   | Controller, Service   |
| mailer                 | ✅              | ❌                   | Service, Interceptor  |
| roles                  | ❌              | ❌                   | -                     |
| salary_advance         | ✅              | ❌                   | Controller, Service   |
| scheduler              | ✅              | ❌                   | Module, Services      |
| services               | ✅              | ❌                   | Controller, Service   |
| toilet_maintenance     | ✅              | ❌                   | Controller, Service   |
| users                  | ✅              | ❌                   | Controller, Service   |
| vehicles               | ✅              | ❌                   | Controller, Service   |
| vehicle_maintenance    | ✅              | ❌                   | Controller, Service   |

## Detalles de los Tests por Módulo

### Auth Module

#### Service Tests (`auth.service.spec.ts`)

- Validación del proceso de login
- Generación y validación de tokens JWT
- Manejo de usuarios no existentes o credenciales inválidas

#### Controller Tests (`auth.controller.spec.ts`)

- Endpoint de login
- Respuestas exitosas con token
- Manejo de errores de autenticación

### Chemical Toilets Module

#### Service Tests (`chemical_toilets.service.spec.ts`)

- Creación de baños químicos
- Actualización de información de baños
- Búsqueda de baños por ID y diversos filtros
- Eliminación de baños químicos
- Cambio de estado de baños (disponible, en uso, en mantenimiento)

#### Controller Tests (`chemical_toilets.controller.spec.ts`)

- Endpoints CRUD para baños químicos
- Validación de DTOs
- Paginación y filtros

### Clients Module

#### Service Tests (`clients.service.spec.ts`)

- Operaciones CRUD para clientes
- Búsqueda de clientes por diversos criterios
- Validación de datos de cliente

#### Controller Tests (`clients.controller.spec.ts`)

- Endpoints para gestión de clientes
- Validación de DTOs de entrada
- Respuestas HTTP correctas

### Employees Module

#### Service Tests (`employees.service.spec.ts`)

- Creación, actualización y eliminación de empleados
- Búsqueda de empleados disponibles
- Gestión de licencias y capacitaciones
- Cambio de estados de empleados

#### Controller Tests (`employees.controller.spec.ts`)

- Endpoints CRUD
- Filtrado y paginación
- Validación de solicitudes

### Mailer Module

#### Service Tests (`mailer.service.spec.ts`)

- Envío de correos electrónicos
- Formateo de plantillas
- Manejo de errores en el envío

#### Interceptor Tests (`mailer.interceptor.spec.ts`)

- Interceptación de respuestas HTTP
- Envío de notificaciones en base a acciones específicas
- Procesamiento asíncrono

### Scheduler Module

#### Module Tests (`scheduler.module.spec.ts`)

- Inicialización correcta del módulo

#### Service Tests

- `contract-expiration.service.spec.ts`: Alertas de vencimiento de contratos
- `employee-leave-scheduler.service.spec.ts`: Programación de ausencias de empleados

### Services Module

#### Service Tests (`services.service.spec.ts`)

- Creación de servicios con/sin condiciones contractuales
- Asignación automática de recursos (empleados, vehículos, baños)
- Búsqueda de servicios por rango de fechas
- Búsqueda de servicios para la fecha actual
- Filtrado por estados
- Actualización de servicios
- Validación de capacidad para servicios de capacitación
- Eliminación de servicios
- Cambio de estado de los servicios
- Transacciones y rollback en caso de error

#### Controller Tests (`services.controller.spec.ts`)

- Endpoints CRUD
- Validación de parámetros
- Filtrado y paginación
- Rutas específicas para obtener servicios por estado

## Ejecución de Tests

### Ejecutar Todos los Tests

```powershell
cd "d:\Personal\mva-backend"
npm test
```

### Ejecutar Tests con Cobertura

```powershell
cd "d:\Personal\mva-backend"
npm run test:cov
```

### Estado Actual de Cobertura de Tests

Actualmente, el proyecto tiene los siguientes niveles de cobertura:

| Métrica    | Cobertura        |
| ---------- | ---------------- |
| Statements | 66.99% (203/303) |
| Branches   | 36.73% (18/49)   |
| Functions  | 51.02% (25/49)   |
| Lines      | 65.37% (185/283) |

Las áreas con menor cobertura incluyen:

- Guards de autenticación (JwtAuthGuard): 27.27% de cobertura de líneas
- Validaciones de DTOs
- Manejo de excepciones en casos extremos

Las áreas con mejor cobertura incluyen:

- Enumeraciones y constantes: 100%
- Controladores básicos
- Flujos principales en servicios

### Ejecutar Tests Específicos

Para ejecutar los tests de un módulo específico:

```powershell
cd "d:\Personal\mva-backend"
npx jest "src/services/services.service.spec.ts" --config=jest.config.js
```

Para ejecutar tests de integración (e2e):

```powershell
cd "d:\Personal\mva-backend"
npm run test:e2e
```

### Ejecutar Tests con Watch Mode

```powershell
cd "d:\Personal\mva-backend"
npm run test:watch
```

### Ejecutar Tests con Configuración de Mocks Específica

```powershell
cd "d:\Personal\mva-backend"
npm run test:mock
```

## Mocks

La aplicación utiliza dos enfoques distintos para los mocks:

### Mocks Globales

La carpeta `/__mocks__` en la raíz contiene mocks globales que se utilizan automáticamente por Jest. Estos mocks están configurados en `jest.config.js` mediante el `moduleNameMapper`. Ejemplo:

```javascript
moduleNameMapper: {
  '^src/salary_advance/entities/salary_advance.entity$':
    '<rootDir>/__mocks__/src/salary_advance/entities/salary_advance.entity.ts',
  // ...otros mapeos
}
```

Estos mocks globales son útiles para:

- Entidades complejas de TypeORM
- Módulos que se utilizan en múltiples tests
- Evitar problemas con decoradores y metadatos

### Mocks Locales

Los mocks locales se encuentran en la carpeta `__mocks__` dentro de cada módulo. Estos mocks son específicos para ese módulo y generalmente contienen:

- Datos de prueba específicos
- Versiones simplificadas de entidades
- Mocks más personalizados para casos de uso específicos

Estos mocks deben importarse explícitamente en los archivos de test.

## Recomendaciones y Mejoras

### 1. Aumentar la Cobertura de Tests de Integración (E2E)

**Situación actual:**
Solo existe un test E2E básico para el controlador principal. Esto deja sin cubrir la mayoría de flujos de trabajo críticos.

**Recomendación:**

- Desarrollar tests E2E para los principales flujos de negocio:
  - Proceso completo de gestión de servicios
  - Flujo de mantenimiento de vehículos y baños
  - Gestión de empleados y ausencias
  - Procesos de facturación

**Ejemplo de implementación:**

```typescript
// Ejemplo básico para test E2E de servicios
describe('ServicesController (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    // Configuración y login
  });

  it('should create a service and assign resources', async () => {
    // Test del flujo completo
  });
});
```

### 2. Implementar Tests para Guards, Pipes y Filters

**Situación actual:**
No existen tests específicos para guards, pipes y filters, componentes críticos para la seguridad y validación.

**Recomendación:**

- Crear tests unitarios para:
  - Guards de autenticación y autorización
  - Pipes de validación
  - Filters de excepciones

**Ejemplo:**

```typescript
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    // Setup
  });

  it('should allow access with valid token', () => {
    // Test
  });
});
```

### 3. Implementar Tests para los DTOs y Validaciones

**Situación actual:**
No hay tests específicos para validar el funcionamiento de los DTOs y sus decoradores de validación.

**Recomendación:**

- Crear tests para validar los DTOs:
  - Validaciones de campos requeridos
  - Validaciones de formato (email, fechas, etc.)
  - Transformaciones (class-transformer)

**Ejemplo:**

```typescript
describe('CreateServiceDto', () => {
  it('should validate required fields', async () => {
    const dto = new CreateServiceDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

### 4. Mejorar la Estructura de los Mocks

**Situación actual:**
Hay cierta inconsistencia entre los mocks globales y los mocks por módulo.

**Recomendación:**

- Establecer un estándar claro sobre cuándo usar cada tipo de mock
- Refactorizar los mocks existentes para seguir un patrón consistente
- Considerar el uso de factory functions para mocks (como en tests de services.service.spec.ts)

### 5. Implementar Tests para el Módulo Roles

**Situación actual:**
El módulo roles carece de tests.

**Recomendación:**

- Implementar tests unitarios para el servicio y controlador de roles
- Probar los permisos y la asignación de roles

### 6. Mejorar los Tests de Manejo de Errores

**Situación actual:**
Algunos módulos tienen tests limitados para escenarios de error.

**Recomendación:**

- Ampliar los tests de errores para todos los servicios
- Verificar que se lancen las excepciones adecuadas
- Verificar el manejo de transacciones y rollbacks

### 7. Implementar Tests de Rendimiento

**Situación actual:**
No hay tests de rendimiento.

**Recomendación:**

- Implementar tests para verificar el rendimiento de las operaciones críticas
- Establecer líneas base de rendimiento

## Conclusión

La aplicación MVA-Backend tiene una buena cobertura de tests unitarios para servicios y controladores, pero carece de tests de integración y pruebas end-to-end más completas. Las mejoras sugeridas ayudarán a fortalecer la calidad del código, prevenir regresiones y facilitar el mantenimiento futuro del sistema.

Para obtener más información sobre cómo implementar estas mejoras, consulte la documentación oficial de NestJS sobre testing: [https://docs.nestjs.com/fundamentals/testing](https://docs.nestjs.com/fundamentals/testing)
