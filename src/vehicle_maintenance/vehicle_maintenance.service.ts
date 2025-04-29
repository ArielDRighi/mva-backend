import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { VehicleMaintenanceRecord } from './entities/vehicle_maintenance_record.entity';
import { CreateMaintenanceDto } from './dto/create_maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update_maintenance.dto';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ResourceState } from '../common/enums/resource-states.enum';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class VehicleMaintenanceService {
  private readonly logger = new Logger(VehicleMaintenanceService.name);

  constructor(
    @InjectRepository(VehicleMaintenanceRecord)
    private maintenanceRepository: Repository<VehicleMaintenanceRecord>,
    private vehiclesService: VehiclesService,
  ) {}

  async create(
    createMaintenanceDto: CreateMaintenanceDto,
  ): Promise<VehicleMaintenanceRecord> {
    this.logger.log(
      `Creando registro de mantenimiento para vehículo: ${createMaintenanceDto.vehiculoId}`,
    );

    // Verificar que el vehículo existe
    const vehicle = await this.vehiclesService.findOne(
      createMaintenanceDto.vehiculoId,
    );

    // NUEVO CÓDIGO: Permitir ASIGNADO y DISPONIBLE para mantenimientos futuros
    // Solo verificamos el estado cuando es para hoy o una fecha pasada
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Inicio del día actual

    const maintenanceDate = new Date(createMaintenanceDto.fechaMantenimiento);
    maintenanceDate.setHours(0, 0, 0, 0); // Inicio del día de mantenimiento

    if (maintenanceDate <= now) {
      // El mantenimiento es para hoy o una fecha pasada, verificamos que esté DISPONIBLE
      if ((vehicle.estado as ResourceState) !== ResourceState.DISPONIBLE) {
        throw new BadRequestException(
          `El vehículo no está disponible para mantenimiento inmediato. Estado actual: ${vehicle.estado}`,
        );
      }

      // Cambiar estado inmediatamente
      await this.vehiclesService.changeStatus(
        vehicle.id,
        ResourceState.EN_MANTENIMIENTO,
      );
      // Actualizar también el estado en el objeto en memoria
      vehicle.estado = ResourceState.EN_MANTENIMIENTO.toString();
    } else {
      // Es un mantenimiento futuro, verificar que el vehículo esté DISPONIBLE o ASIGNADO
      if (
        (vehicle.estado as ResourceState) !== ResourceState.DISPONIBLE &&
        (vehicle.estado as ResourceState) !== ResourceState.ASIGNADO
      ) {
        throw new BadRequestException(
          `Solo vehículos en estado DISPONIBLE o ASIGNADO pueden programar mantenimientos futuros. Estado actual: ${vehicle.estado}`,
        );
      }
    }

    const maintenanceRecord =
      this.maintenanceRepository.create(createMaintenanceDto);
    maintenanceRecord.vehicle = vehicle;

    return this.maintenanceRepository.save(maintenanceRecord);
  }

  // Método para completar un mantenimiento y devolver el vehículo a DISPONIBLE
  async completeMaintenace(id: number): Promise<VehicleMaintenanceRecord> {
    const record = await this.findOne(id);

    // Marcar el mantenimiento como completado
    record.completado = true;
    record.fechaCompletado = new Date();

    // Cambiar el estado del vehículo a DISPONIBLE en la base de datos
    await this.vehiclesService.changeStatus(
      record.vehiculoId,
      ResourceState.DISPONIBLE,
    );

    // AÑADIR ESTA LÍNEA: Actualizar el estado del vehículo en el objeto en memoria también
    if (record.vehicle) {
      record.vehicle.estado = ResourceState.DISPONIBLE.toString();
    } else {
      // Si record.vehicle no está cargado, obtener el vehículo actualizado
      record.vehicle = await this.vehiclesService.findOne(record.vehiculoId);
    }

    return this.maintenanceRepository.save(record);
  }

  // Verificar si un vehículo tiene mantenimiento programado para una fecha
  async hasScheduledMaintenance(
    vehiculoId: number,
    fecha: Date,
  ): Promise<boolean> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    const maintenanceCount = await this.maintenanceRepository.count({
      where: {
        vehiculoId,
        fechaMantenimiento: Between(startOfDay, endOfDay),
        completado: false, // Sólo considerar mantenimientos no completados
      },
    });

    return maintenanceCount > 0;
  }

  async findAll(): Promise<VehicleMaintenanceRecord[]> {
    this.logger.log('Recuperando todos los registros de mantenimiento');
    return this.maintenanceRepository.find({
      relations: ['vehicle'],
    });
  }

  async findOne(id: number): Promise<VehicleMaintenanceRecord> {
    this.logger.log(`Buscando registro de mantenimiento con id: ${id}`);
    const maintenanceRecord = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!maintenanceRecord) {
      throw new NotFoundException(
        `Registro de mantenimiento con id ${id} no encontrado`,
      );
    }

    return maintenanceRecord;
  }

  async findByVehicle(vehiculoId: number): Promise<VehicleMaintenanceRecord[]> {
    this.logger.log(
      `Buscando registros de mantenimiento para vehículo: ${vehiculoId}`,
    );

    // Verificar que el vehículo existe
    await this.vehiclesService.findOne(vehiculoId);

    return this.maintenanceRepository.find({
      where: { vehiculoId },
      relations: ['vehicle'],
      order: { fechaMantenimiento: 'DESC' },
    });
  }

  async findUpcomingMaintenances(): Promise<VehicleMaintenanceRecord[]> {
    this.logger.log('Recuperando próximos mantenimientos');
    const today = new Date();

    return this.maintenanceRepository.find({
      where: {
        proximoMantenimiento: MoreThanOrEqual(today),
      },
      relations: ['vehicle'],
      order: { proximoMantenimiento: 'ASC' },
    });
  }

  async update(
    id: number,
    updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<VehicleMaintenanceRecord> {
    this.logger.log(`Actualizando registro de mantenimiento con id: ${id}`);

    const maintenanceRecord = await this.findOne(id);
    Object.assign(maintenanceRecord, updateMaintenanceDto);

    return this.maintenanceRepository.save(maintenanceRecord);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Eliminando registro de mantenimiento con id: ${id}`);

    const maintenanceRecord = await this.findOne(id);
    await this.maintenanceRepository.remove(maintenanceRecord);
  }
}

@Injectable()
export class MaintenanceSchedulerService {
  constructor(
    @InjectRepository(VehicleMaintenanceRecord)
    private vehicleMaintenanceRepository: Repository<VehicleMaintenanceRecord>,
    private vehiclesService: VehiclesService,
    // También inyectar dependencias para los baños químicos
  ) {}

  @Cron('0 0 * * *') // Ejecutar todos los días a medianoche
  async handleScheduledMaintenances() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar mantenimientos programados para hoy que no estén completados
    const todaysMaintenances = await this.vehicleMaintenanceRepository.find({
      where: {
        fechaMantenimiento: Between(today, tomorrow),
        completado: false,
      },
      relations: ['vehicle'],
    });

    // Cambiar estado de los vehículos a EN_MANTENIMIENTO
    for (const maintenance of todaysMaintenances) {
      await this.vehiclesService.changeStatus(
        maintenance.vehiculoId,
        ResourceState.EN_MANTENIMIENTO,
      );
    }
  }
}
