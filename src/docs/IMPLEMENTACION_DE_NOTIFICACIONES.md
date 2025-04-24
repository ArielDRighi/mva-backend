# Implementación del Sistema de Notificaciones para MVA Backend

implementar un sistema completo de notificaciones con énfasis en el envío automático de correos a empleados asignados a servicios, incluyendo todos los detalles relevantes de la asignación.

## Análisis del Contexto Actual

Veo que en tu sistema:

- Los servicios (como instalaciones) requieren asignar recursos (empleados, baños, vehículos).
- Los vehículos y baños se asignan al servicio, no directamente al empleado.
- Las asignaciones se gestionan mediante la tabla `ResourceAssignment` que relaciona servicios con empleados, vehículos y baños.
- Ya tienes configurado Nodemailer para el envío de correos electrónicos.

## Plan de Implementación

### 1. Estructura de la Entidad de Notificación

Primero, necesitamos crear la entidad para almacenar las notificaciones:

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../users/entities/user.entity';
import { Empleado } from '../../employees/entities/employee.entity';
import { Service } from '../../services/entities/service.entity';

export enum NotificationType {
  SERVICE_ASSIGNMENT = 'SERVICE_ASSIGNMENT', // Asignación de servicio
  SERVICE_MODIFICATION = 'SERVICE_MODIFICATION', // Modificación de servicio
  SERVICE_STATUS_CHANGE = 'SERVICE_STATUS_CHANGE', // Cambio de estado (inicio, finalización)
  MAINTENANCE_DUE = 'MAINTENANCE_DUE', // Mantenimiento próximo
  VEHICLE_MAINTENANCE = 'VEHICLE_MAINTENANCE', // Mantenimiento de vehículo
  TOILET_MAINTENANCE = 'TOILET_MAINTENANCE', // Mantenimiento de baño
  SYSTEM_ALERT = 'SYSTEM_ALERT', // Alerta del sistema
}

export enum NotificationStatus {
  PENDING = 'PENDING', // Pendiente de envío
  SENT = 'SENT', // Enviada correctamente
  FAILED = 'FAILED', // Error en el envío
  READ = 'READ', // Leída por el destinatario
  ARCHIVED = 'ARCHIVED', // Archivada
}

@Entity('notificaciones')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_ALERT,
  })
  tipo: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  estado: NotificationStatus;

  // Metadatos flexibles para almacenar información adicional según el tipo de notificación
  @Column({ type: 'json', nullable: true })
  metadatos: Record<string, any>;

  // Servicio asociado a la notificación (opcional)
  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'servicioId' })
  servicio: Service;

  @Column({ nullable: true })
  servicioId: number;

  // Usuario del sistema que recibe la notificación (opcional)
  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuarioId' })
  usuario: Usuario;

  @Column({ nullable: true })
  usuarioId: number;

  // Empleado que recibe la notificación (opcional)
  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleadoId' })
  empleado: Empleado;

  @Column({ nullable: true })
  empleadoId: number;

  // Para notificaciones por email
  @Column({ nullable: true })
  emailDestinatario: string;

  @Column({ type: 'boolean', default: false })
  emailEnviado: boolean;

  @Column({ nullable: true })
  fechaEnvioEmail: Date;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualizacion: Date;
}
```

### 2. DTOs para la Notificación

```typescript
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  NotificationStatus,
  NotificationType,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  titulo: string;

  @IsString()
  mensaje: string;

  @IsEnum(NotificationType)
  tipo: NotificationType;

  @IsOptional()
  @IsEnum(NotificationStatus)
  estado?: NotificationStatus;

  @IsOptional()
  metadatos?: Record<string, any>;

  @IsOptional()
  servicioId?: number;

  @IsOptional()
  usuarioId?: number;

  @IsOptional()
  empleadoId?: number;

  @IsOptional()
  @IsEmail()
  emailDestinatario?: string;
}

// filepath: src/notifications/dto/update-notification.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}
```

### 3. Servicio Base de Notificaciones

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import * as nodemailer from '../../config/nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    this.logger.log(
      `Creando notificación de tipo: ${createNotificationDto.tipo}`,
    );

    const notification = this.notificationsRepository.create(
      createNotificationDto,
    );
    const savedNotification =
      await this.notificationsRepository.save(notification);

    // Si la notificación tiene destinatario de email, enviar correo
    if (notification.emailDestinatario) {
      try {
        await this.sendEmailNotification(savedNotification);
        savedNotification.emailEnviado = true;
        savedNotification.fechaEnvioEmail = new Date();
        savedNotification.estado = NotificationStatus.SENT;
        await this.notificationsRepository.save(savedNotification);
      } catch (error) {
        this.logger.error(
          `Error al enviar email: ${error.message}`,
          error.stack,
        );
        savedNotification.estado = NotificationStatus.FAILED;
        await this.notificationsRepository.save(savedNotification);
      }
    }

    return savedNotification;
  }

  async findAll(
    filters?: FindOptionsWhere<Notification>,
  ): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: filters,
      relations: ['usuario', 'empleado', 'servicio'],
      order: { fechaCreacion: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Notification> {
    return this.notificationsRepository.findOne({
      where: { id },
      relations: ['usuario', 'empleado', 'servicio'],
    });
  }

  async findByEmployee(empleadoId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { empleadoId },
      order: { fechaCreacion: 'DESC' },
    });
  }

  async update(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    await this.notificationsRepository.update(id, updateNotificationDto);
    return this.findOne(id);
  }

  async markAsRead(id: number): Promise<Notification> {
    await this.notificationsRepository.update(id, {
      estado: NotificationStatus.READ,
    });
    return this.findOne(id);
  }

  async markAsArchived(id: number): Promise<Notification> {
    await this.notificationsRepository.update(id, {
      estado: NotificationStatus.ARCHIVED,
    });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.notificationsRepository.delete(id);
  }

  // Método para enviar notificaciones por email usando Nodemailer
  private async sendEmailNotification(
    notification: Notification,
  ): Promise<void> {
    if (!notification.emailDestinatario) {
      throw new Error('No hay destinatario de email especificado');
    }

    // Usar la configuración existente de Nodemailer según el tipo de notificación
    switch (notification.tipo) {
      case NotificationType.SERVICE_ASSIGNMENT:
        const serviceData = notification.metadatos?.serviceDetails;
        if (serviceData) {
          await nodemailer.sendRoute(
            notification.emailDestinatario,
            serviceData.employeeName,
            serviceData.vehicle,
            serviceData.toilets,
            serviceData.clients,
            serviceData.serviceType,
            serviceData.taskDate,
          );
        } else {
          throw new Error(
            'Metadatos insuficientes para notificación de asignación',
          );
        }
        break;

      case NotificationType.SERVICE_MODIFICATION:
        const modifiedData = notification.metadatos?.serviceDetails;
        if (modifiedData) {
          await nodemailer.sendRouteModified(
            notification.emailDestinatario,
            modifiedData.employeeName,
            modifiedData.vehicle,
            modifiedData.toilets,
            modifiedData.clients,
            modifiedData.serviceType,
            modifiedData.taskDate,
          );
        } else {
          throw new Error(
            'Metadatos insuficientes para notificación de modificación',
          );
        }
        break;

      case NotificationType.SERVICE_STATUS_CHANGE:
        const statusData = notification.metadatos?.serviceDetails;
        if (statusData && statusData.status === 'EN_PROGRESO') {
          await nodemailer.sendInProgressNotification(
            [statusData.adminEmail],
            [statusData.supervisorEmail],
            statusData.employeeName,
            {
              client: statusData.client,
              vehicle: statusData.vehicle,
              serviceType: statusData.serviceType,
              toilets: statusData.toilets,
              taskDate: statusData.taskDate,
            },
          );
        } else if (statusData && statusData.status === 'COMPLETADO') {
          await nodemailer.sendCompletionNotification(
            [statusData.adminEmail],
            [statusData.supervisorEmail],
            statusData.employeeName,
            {
              client: statusData.client,
              vehicle: statusData.vehicle,
              serviceType: statusData.serviceType,
              toilets: statusData.toilets,
              taskDate: statusData.taskDate,
            },
          );
        }
        break;

      default:
        // Implementar según necesidades para otros tipos de notificación
        throw new Error(
          `Tipo de notificación no soportado: ${notification.tipo}`,
        );
    }
  }

  async resendFailedNotifications(): Promise<void> {
    this.logger.log('Reintentando envío de notificaciones fallidas');

    const failedNotifications = await this.notificationsRepository.find({
      where: { estado: NotificationStatus.FAILED, emailDestinatario: true },
    });

    for (const notification of failedNotifications) {
      try {
        await this.sendEmailNotification(notification);
        notification.emailEnviado = true;
        notification.fechaEnvioEmail = new Date();
        notification.estado = NotificationStatus.SENT;
        await this.notificationsRepository.save(notification);
        this.logger.log(
          `Reenvío exitoso de notificación ID ${notification.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Falló el reenvío de notificación ID ${notification.id}: ${error.message}`,
        );
      }
    }
  }
}
```

### 4. Servicio Específico para Notificaciones de Servicios

Este servicio se encargará específicamente de crear notificaciones relacionadas con los servicios (instalación, mantenimiento, etc.):

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import {
  NotificationType,
  NotificationStatus,
} from '../entities/notification.entity';
import { Service } from '../../services/entities/service.entity';
import { ResourceAssignment } from '../../services/entities/resource-assignment.entity';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';
import { Empleado } from '../../employees/entities/employee.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../../chemical_toilets/entities/chemical_toilet.entity';

@Injectable()
export class ServiceNotificationsService {
  private readonly logger = new Logger(ServiceNotificationsService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Empleado)
    private empleadosRepository: Repository<Empleado>,
    @InjectRepository(Vehicle)
    private vehiculosRepository: Repository<Vehicle>,
    @InjectRepository(ChemicalToilet)
    private banosRepository: Repository<ChemicalToilet>,
  ) {}

  /**
   * Notifica a los empleados asignados a un servicio
   * @param service El servicio al que se asignaron los empleados
   */
  async notifyServiceAssignment(service: Service): Promise<void> {
    this.logger.log(
      `Generando notificaciones de asignación para servicio ID ${service.id}`,
    );

    if (!service.asignaciones || service.asignaciones.length === 0) {
      this.logger.warn(
        `Servicio ${service.id} no tiene asignaciones para notificar`,
      );
      return;
    }

    // Agrupar asignaciones por empleado para enviar una única notificación por empleado
    const employeeAssignments: Map<number, ResourceAssignment[]> = new Map();

    for (const assignment of service.asignaciones) {
      if (assignment.empleado) {
        const employeeId = assignment.empleadoId;
        if (!employeeAssignments.has(employeeId)) {
          employeeAssignments.set(employeeId, []);
        }
        employeeAssignments.get(employeeId)?.push(assignment);
      }
    }

    // Procesar notificaciones por empleado
    for (const [employeeId, assignments] of employeeAssignments.entries()) {
      await this.createEmployeeServiceNotification(
        service,
        employeeId,
        assignments,
      );
    }
  }

  /**
   * Crea una notificación detallada para un empleado sobre un servicio
   */
  private async createEmployeeServiceNotification(
    service: Service,
    employeeId: number,
    assignments: ResourceAssignment[],
  ): Promise<void> {
    try {
      // Obtener información completa del empleado
      const employee = await this.empleadosRepository.findOne({
        where: { id: employeeId },
      });

      if (!employee || !employee.email) {
        this.logger.warn(
          `No se encontró empleado o email para ID ${employeeId}`,
        );
        return;
      }

      // Obtener todos los vehículos asignados a este empleado
      const vehicles = await Promise.all(
        assignments
          .filter((a) => a.vehiculoId)
          .map((a) =>
            this.vehiculosRepository.findOne({ where: { id: a.vehiculoId } }),
          ),
      );

      // Filtrar resultados nulos
      const validVehicles = vehicles.filter((v): v is Vehicle => v !== null);

      // Obtener todos los baños asignados a este servicio (pueden estar asignados a diferentes empleados)
      const serviceToiletIds = assignments
        .filter((a) => a.banoId)
        .map((a) => a.banoId);

      const toilets = await Promise.all(
        serviceToiletIds.map((id) =>
          this.banosRepository.findOne({ where: { baño_id: id } }),
        ),
      );

      const validToilets = toilets.filter(
        (t): t is ChemicalToilet => t !== null,
      );

      // Formatear fecha del servicio
      const serviceFecha = new Date(service.fechaProgramada).toLocaleDateString(
        'es-ES',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        },
      );

      // Preparar información de vehículos
      const vehicleNames =
        validVehicles
          .map((v) => `${v.marca} ${v.modelo} (${v.placa})`)
          .join(', ') || 'No asignado';

      // Preparar información de baños
      const toiletDetails = validToilets
        .map((t) => `${t.codigo_interno || 'Baño'} (ID: ${t.baño_id})`)
        .filter(Boolean);

      // Preparar los metadatos para el correo
      const serviceDetails = {
        employeeName: `${employee.nombre} ${employee.apellido}`,
        vehicle: vehicleNames,
        toilets: toiletDetails.length > 0 ? toiletDetails : ['No asignados'],
        clients: [
          `${service.cliente?.nombre_empresa || 'Cliente'} - ${service.ubicacion || 'Sin ubicación especificada'}`,
        ],
        serviceType: this.getServiceTypeName(service.tipoServicio),
        taskDate: serviceFecha,
      };

      // Título y mensaje para la notificación
      const titulo = `Asignación de servicio: ${this.getServiceTypeName(service.tipoServicio)}`;
      const mensaje = this.createServiceAssignmentMessage(
        service,
        serviceDetails,
      );

      // Crear la notificación
      await this.notificationsService.create({
        titulo,
        mensaje,
        tipo: NotificationType.SERVICE_ASSIGNMENT,
        estado: NotificationStatus.PENDING,
        servicioId: service.id,
        empleadoId: employeeId,
        emailDestinatario: employee.email,
        metadatos: {
          serviceId: service.id,
          serviceDetails,
        },
      });

      this.logger.log(
        `Notificación creada para empleado ${employeeId} sobre servicio ${service.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error al crear notificación para empleado ${employeeId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Notifica modificaciones en un servicio
   */
  async notifyServiceModification(service: Service): Promise<void> {
    // Similar a notifyServiceAssignment
    this.logger.log(
      `Generando notificaciones de modificación para servicio ID ${service.id}`,
    );

    // Implementación similar a notifyServiceAssignment pero con NotificationType.SERVICE_MODIFICATION
    // ...
  }

  /**
   * Notifica cambios de estado en un servicio
   */
  async notifyServiceStatusChange(
    service: Service,
    previousState: ServiceState,
  ): Promise<void> {
    this.logger.log(
      `Generando notificaciones de cambio de estado para servicio ID ${service.id}`,
    );

    // Notificar solo cambios relevantes (inicio y finalización)
    if (
      service.estado === ServiceState.EN_PROGRESO ||
      service.estado === ServiceState.COMPLETADO
    ) {
      // Obtener administradores y supervisores (implementar según tu lógica de usuarios)
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@mva.com';
      const supervisorEmail =
        process.env.SUPERVISOR_EMAIL || 'supervisor@mva.com';

      // Notificar a cada empleado asignado
      if (service.asignaciones && service.asignaciones.length > 0) {
        for (const assignment of service.asignaciones) {
          if (assignment.empleado) {
            const employee = assignment.empleado;

            // Obtener detalles del servicio
            // (implementación similar a createEmployeeServiceNotification)

            // Crear notificación de cambio de estado
            await this.notificationsService.create({
              titulo: `Servicio ${service.estado === ServiceState.EN_PROGRESO ? 'iniciado' : 'completado'}`,
              mensaje: `El servicio de ${this.getServiceTypeName(service.tipoServicio)} ha sido ${service.estado === ServiceState.EN_PROGRESO ? 'iniciado' : 'completado'}.`,
              tipo: NotificationType.SERVICE_STATUS_CHANGE,
              estado: NotificationStatus.PENDING,
              servicioId: service.id,
              empleadoId: employee.id,
              emailDestinatario: employee.email,
              metadatos: {
                serviceId: service.id,
                previousState,
                newState: service.estado,
                serviceDetails: {
                  // Completar detalles necesarios
                  status: service.estado,
                  adminEmail,
                  supervisorEmail,
                  employeeName: `${employee.nombre} ${employee.apellido}`,
                  // Más datos...
                },
              },
            });
          }
        }
      }
    }
  }

  /**
   * Obtiene el nombre amigable del tipo de servicio
   */
  private getServiceTypeName(tipo: ServiceType): string {
    const nombres = {
      [ServiceType.INSTALACION]: 'Instalación',
      [ServiceType.RETIRO]: 'Retiro',
      [ServiceType.LIMPIEZA]: 'Limpieza',
      [ServiceType.MANTENIMIENTO]: 'Mantenimiento',
      [ServiceType.TRASLADO]: 'Traslado',
      [ServiceType.REEMPLAZO]: 'Reemplazo',
      [ServiceType.MANTENIMIENTO_IN_SITU]: 'Mantenimiento en sitio',
      [ServiceType.REUBICACION]: 'Reubicación',
      [ServiceType.REPARACION]: 'Reparación',
    };
    return nombres[tipo] || tipo;
  }

  /**
   * Crea un mensaje detallado para la notificación de asignación
   */
  private createServiceAssignmentMessage(
    service: Service,
    details: any,
  ): string {
    return `
      Se te ha asignado un nuevo servicio de ${this.getServiceTypeName(service.tipoServicio)} 
      programado para el ${details.taskDate} en ${service.ubicacion || 'ubicación no especificada'}.
      
      Detalles del servicio:
      - Cliente: ${service.cliente?.nombre_empresa || 'No especificado'}
      - Vehículo asignado: ${details.vehicle}
      - Baños a gestionar: ${details.toilets.join(', ')}
      - Notas adicionales: ${service.notas || 'Ninguna'}
      
      Por favor, revisa la aplicación para más detalles.
    `;
  }
}
```

### 5. Integración con ServicesService

Ahora necesitamos modificar el `ServicesService` para que envíe notificaciones en los momentos adecuados:

```typescript
// Añadir esta importación
import { ServiceNotificationsService } from '../notifications/services/service-notifications.service';

// Modificar el constructor para inyectar el servicio de notificaciones
constructor(
  // Mantener los servicios existentes...
  private readonly serviceNotificationsService: ServiceNotificationsService,
) {}

// Modificar el método create
async create(createServiceDto: CreateServiceDto): Promise<Service> {
  // Mantener el código existente...

  // Al final, después de guardar y asignar recursos:
  const completeService = await this.findOne(savedService.id);

  // Notificar asignación de servicio
  if (completeService.asignaciones?.length > 0) {
    await this.serviceNotificationsService.notifyServiceAssignment(completeService);
  }

  return completeService;
}

// Modificar el método update
async update(id: number, updateServiceDto: UpdateServiceDto): Promise<Service> {
  // Mantener el código existente...

  // Después de actualizar y reasignar recursos:
  const updatedService = await this.findOne(savedService.id);

  // Notificar cambios en asignaciones del servicio
  if (updatedService.asignaciones?.length > 0) {
    await this.serviceNotificationsService.notifyServiceModification(updatedService);
  }

  return updatedService;
}

// Modificar el método changeStatus
async changeStatus(id: number, nuevoEstado: ServiceState): Promise<Service> {
  // Almacenar el estado anterior para la notificación
  const service = await this.findOne(id);
  const previousState = service.estado;

  // Mantener el código existente...

  // Notificar cambio de estado (especialmente para estados EN_PROGRESO y COMPLETADO)
  if (nuevoEstado === ServiceState.EN_PROGRESO || nuevoEstado === ServiceState.COMPLETADO) {
    await this.serviceNotificationsService.notifyServiceStatusChange(savedService, previousState);
  }

  return savedService;
}
```

### 6. Controlador de Notificaciones

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { NotificationStatus } from '../entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('ADMIN', 'SUPERVISOR')
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Query('estado') estado?: NotificationStatus,
    @Query('empleadoId') empleadoId?: number,
    @Query('usuarioId') usuarioId?: number,
    @Query('tipo') tipo?: string,
  ) {
    const filters: any = {};
    if (estado) filters.estado = estado;
    if (empleadoId) filters.empleadoId = empleadoId;
    if (usuarioId) filters.usuarioId = usuarioId;
    if (tipo) filters.tipo = tipo;

    return this.notificationsService.findAll(filters);
  }

  @Get('employee/:empleadoId')
  findByEmployee(@Param('empleadoId') empleadoId: string) {
    return this.notificationsService.findByEmployee(+empleadoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(+id, updateNotificationDto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(+id);
  }

  @Patch(':id/archive')
  markAsArchived(@Param('id') id: string) {
    return this.notificationsService.markAsArchived(+id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(+id);
  }

  @Post('resend-failed')
  @Roles('ADMIN', 'SUPERVISOR')
  resendFailed() {
    return this.notificationsService.resendFailedNotifications();
  }
}
```

### 7. Módulo de Notificaciones

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './services/notifications.service';
import { ServiceNotificationsService } from './services/service-notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { Empleado } from '../employees/entities/employee.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Empleado, Vehicle, ChemicalToilet]),
    ScheduleModule.forRoot(),
  ],
  providers: [NotificationsService, ServiceNotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService, ServiceNotificationsService],
})
export class NotificationsModule {}
```

### 8. Tareas programadas para notificaciones periódicas

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class NotificationsTasks {
  private readonly logger = new Logger(NotificationsTasks.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  // Reintentar notificaciones fallidas cada hora
  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedNotifications() {
    this.logger.log(
      'Ejecutando tarea programada: reintento de notificaciones fallidas',
    );
    try {
      await this.notificationsService.resendFailedNotifications();
    } catch (error) {
      this.logger.error(
        'Error en reintento de notificaciones fallidas',
        error.stack,
      );
    }
  }

  // Implementar otras tareas de notificación periódica según necesidades
  // Por ejemplo: recordatorios de servicios próximos, alertas de mantenimientos, etc.
}
```

### 9. Actualizar AppModule

Finalmente, necesitamos registrar el módulo de notificaciones en el AppModule:

```typescript
import { Module } from '@nestjs/common';
import { NotificationsModule } from './notifications/notifications.module';
// otros imports

@Module({
  imports: [
    // otros módulos
    NotificationsModule,
  ],
})
export class AppModule {}
```

## Explicación de la Solución

### Estructura General

1. **Entidad de Notificación**: Diseñada para almacenar todos los tipos de notificaciones con un schema flexible que permite vincular con servicios, empleados y usuarios.

2. **Servicios Especializados**:

   - `NotificationsService`: Gestión básica CRUD y envío de emails.
   - `ServiceNotificationsService`: Lógica específica para notificaciones de servicios.

3. **Integración con ServicesService**: Puntos de integración en métodos clave:
   - `create()`: Notificación de asignación inicial
   - `update()`: Notificación de modificaciones
   - `changeStatus()`: Notificación de inicio/finalización

### Flujo para Notificaciones de Asignación de Servicios

1. Se crea un servicio mediante `ServicesService.create()` con asignaciones.
2. Al finalizar, se llama a `ServiceNotificationsService.notifyServiceAssignment()`.
3. Este método:

   - Agrupa las asignaciones por empleado
   - Para cada empleado, recopila información detallada (vehículos, baños, cliente)
   - Crea una notificación personalizada con todos los detalles del servicio
   - La marca para envío por email

4. El `NotificationsService` envía el email usando la configuración existente de Nodemailer.
5. Se actualiza el estado de la notificación según el resultado del envío.

### Características Clave

1. **Persistencia**: Todas las notificaciones se guardan en la base de datos para seguimiento.
2. **Reintento automático**: Las notificaciones fallidas se reintentan periódicamente.
3. **Seguimiento de estado**: Las notificaciones tienen estados (PENDING, SENT, FAILED, READ, ARCHIVED).
4. **Metadatos flexibles**: Cada tipo de notificación puede incluir datos específicos.
5. **Agrupación inteligente**: Las notificaciones relacionadas con un servicio se agrupan por empleado.

### Consideraciones para Implementación

1. **Escalabilidad**: La arquitectura permite añadir nuevos tipos de notificaciones fácilmente.
2. **Optimización**: Uso de transacciones para garantizar consistencia en actualizaciones.
3. **Mantenibilidad**: Servicios separados para diferentes responsabilidades.
4. **Rendimiento**: Carga diferida de relaciones para evitar consultas innecesarias.

## Pasos siguientes recomendados

1. Implementar una interfaz frontend para que los usuarios vean sus notificaciones.
2. Añadir notificaciones para mantenimientos programados de vehículos y baños.
3. Implementar notificaciones push o en tiempo real para mejorar la experiencia de usuario.
4. Crear un panel de administración para monitorear el estado de las notificaciones.

Esta implementación cubre todos los requisitos solicitados y proporciona una base sólida para expandir el sistema de notificaciones según sea necesario en el futuro.
