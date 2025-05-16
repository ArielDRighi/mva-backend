# Documentación del Módulo Scheduler (MVA Backend)

## Índice

1. Introducción
2. Configuración del Módulo
3. Tareas Programadas
   - 1. Verificación de Contratos Expirados
   - 2. Gestión Automática de Licencias de Empleados
4. Implementación y Detalles Técnicos
5. Logging y Depuración
6. Ejemplos y Casos de Uso
7. Consideraciones de Despliegue

## 1. Introducción

El módulo `Scheduler` proporciona la infraestructura para ejecutar tareas programadas y automatizadas dentro del sistema MVA. Utiliza el paquete `@nestjs/schedule` para programar la ejecución periódica de diversas funciones críticas del sistema, como la verificación de contratos expirados y la gestión automática de cambios de estado en licencias de empleados.

## 2. Configuración del Módulo

El módulo Scheduler está configurado en `scheduler.module.ts` e integra todos los servicios programados del sistema:

```typescript
@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Service, ChemicalToilet, EmployeeLeave]),
  ],
  providers: [ContractExpirationService, EmployeeLeaveSchedulerService],
  exports: [ContractExpirationService, EmployeeLeaveSchedulerService],
})
export class SchedulerModule {}
```

La configuración incluye:

- **ScheduleModule.forRoot()**: Inicializa el sistema de programación de tareas de NestJS.
- **TypeOrmModule.forFeature()**: Registra las entidades necesarias para los servicios programados.
- **Providers**: Servicios que contienen la lógica de las tareas programadas.

## 3. Tareas Programadas

### 1. Verificación de Contratos Expirados

**Servicio**: `ContractExpirationService`  
**Programación**: Diariamente a las 00:01 (`@Cron('1 0 * * *')`)  
**Descripción**: Verifica y procesa los contratos de servicios que han expirado.

**Funcionamiento**:

1. Busca servicios de tipo INSTALACIÓN cuya fecha de finalización de asignación es anterior a la fecha actual.
2. Para cada servicio expirado, libera los baños químicos asociados cambiando su estado a DISPONIBLE.
3. Actualiza el registro del servicio, eliminando la fecha de finalización de asignación.

**Ejemplo de log exitoso**:

```
[ContractExpirationService] Ejecutando verificación de contratos expirados
[ContractExpirationService] Encontrados 3 servicios con contratos expirados
[ContractExpirationService] Liberando baño 45 por fin de contrato
[ContractExpirationService] Servicio 123 procesado exitosamente
```

### 2. Gestión Automática de Licencias de Empleados

**Servicio**: `EmployeeLeaveSchedulerService`  
**Programación**: Diariamente a medianoche (`@Cron('0 0 * * *')`)  
**Descripción**: Actualiza automáticamente el estado de disponibilidad de los empleados según sus licencias programadas.

**Funcionamiento**:

1. Identifica empleados que inician licencia en el día actual y cambia su estado a NO_DISPONIBLE.
2. Identifica empleados que finalizan licencia en el día actual y verifica si tienen otra licencia programada a continuación.
3. Si no tienen otra licencia inmediata, cambia su estado a DISPONIBLE.

**Ejemplo de log exitoso**:

```
[EmployeeLeaveSchedulerService] Ejecutando actualización de estados por licencias: 2025-05-07
[EmployeeLeaveSchedulerService] Empleado 32 inicia periodo de licencia (VACACIONES)
[EmployeeLeaveSchedulerService] Empleado 28 finaliza periodo de licencia, vuelve a estar disponible
```

## 4. Implementación y Detalles Técnicos

### ContractExpirationService

Este servicio utiliza TypeORM para interactuar con las entidades Service y ChemicalToilet:

```typescript
@Injectable()
export class ContractExpirationService {
  private readonly logger = new Logger(ContractExpirationService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,
  ) {}

  @Cron('1 0 * * *')
  async checkExpiredContracts() {
    // Implementación...
  }
}
```

### EmployeeLeaveSchedulerService

Este servicio gestiona los cambios de estado de empleados según sus licencias:

```typescript
@Injectable()
export class EmployeeLeaveSchedulerService {
  private readonly logger = new Logger(EmployeeLeaveSchedulerService.name);

  constructor(
    @InjectRepository(EmployeeLeave)
    private leaveRepository: Repository<EmployeeLeave>,
    private employeesService: EmployeesService,
  ) {}

  @Cron('0 0 * * *')
  async handleScheduledLeaves() {
    // Implementación...
  }
}
```

## 5. Logging y Depuración

Ambos servicios implementan un sistema de logging detallado utilizando el `Logger` integrado de NestJS:

- **Nivel INFO**: Registra el inicio de las tareas programadas y las acciones principales realizadas.
- **Nivel ERROR**: Captura y registra errores durante la ejecución de tareas, incluyendo detalles de la excepción.

### Ejemplo de logs de error:

```
[ContractExpirationService] Error al verificar contratos expirados: Error conectando a la base de datos
Error: ETIMEDOUT: Connection timed out
    at Connection.connectToServer (.../node_modules/typeorm/...)
    at ...
```

## 6. Ejemplos y Casos de Uso

### Escenario: Contratos finalizados

Cuando un contrato de instalación de baños químicos finaliza:

1. La tarea programada `checkExpiredContracts()` se ejecuta a las 00:01.
2. Identifica todos los contratos que finalizaron el día anterior.
3. Libera automáticamente los baños químicos asignados a esos contratos.
4. Los baños cambian a estado DISPONIBLE, permitiendo su reasignación a nuevos contratos.
5. Se registra la actividad en los logs del sistema.

### Escenario: Empleado en licencia por vacaciones

Cuando un empleado tiene programadas vacaciones:

1. La tarea `handleScheduledLeaves()` se ejecuta a medianoche.
2. El día que comienzan las vacaciones, el estado del empleado cambia automáticamente a NO_DISPONIBLE.
3. El día que finalizan, si no hay otra licencia consecutiva, su estado cambia a DISPONIBLE.

## 7. Consideraciones de Despliegue

Para garantizar el correcto funcionamiento del módulo Scheduler:

1. **Zona horaria**: Asegúrese de que el servidor esté configurado con la zona horaria correcta para que las tareas se ejecuten a las horas previstas.
2. **Persistencia**: Las tareas programadas dependen de la correcta configuración de la base de datos y de la conexión persistente a la misma.
3. **Monitorización**: Implemente un sistema de monitorización de logs para detectar fallos en la ejecución de tareas programadas.
4. **Respaldo**: En caso de caída del servidor, verifique qué tareas programadas no se ejecutaron y considere la ejecución manual si es necesario.

**Nota**: En entornos con múltiples instancias del backend, asegúrese de que las tareas programadas se ejecuten solo en una instancia para evitar duplicación.
