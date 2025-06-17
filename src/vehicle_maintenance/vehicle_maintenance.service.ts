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
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

    // Si no se especifica fecha de mantenimiento, es un mantenimiento sin fecha específica
    if (!createMaintenanceDto.fechaMantenimiento) {
      // Para mantenimientos sin fecha específica, el vehículo debe estar DISPONIBLE o ASIGNADO
      if (
        (vehicle.estado as ResourceState) !== ResourceState.DISPONIBLE &&
        (vehicle.estado as ResourceState) !== ResourceState.ASIGNADO
      ) {
        throw new BadRequestException(
          `Solo vehículos en estado DISPONIBLE o ASIGNADO pueden tener mantenimientos sin fecha específica. Estado actual: ${vehicle.estado}`,
        );
      }
    } else {
      // Si se especifica fecha, aplicar la lógica original
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
          ResourceState.MANTENIMIENTO,
        );
        // Actualizar también el estado en el objeto en memoria
        vehicle.estado = ResourceState.MANTENIMIENTO.toString();
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
  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<{
    data: VehicleMaintenanceRecord[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const query = this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.vehicle', 'vehicle')
      .orderBy('maintenance.fechaMantenimiento', 'DESC', 'NULLS LAST')
      .skip(skip)
      .take(limit);

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      // Primer término con WHERE - incluir marca del vehículo
      query.where(
        `(LOWER(vehicle.modelo) LIKE :term0 OR
          LOWER(vehicle.placa) LIKE :term0 OR
          LOWER(vehicle.marca) LIKE :term0 OR
          LOWER(maintenance.descripcion) LIKE :term0 OR
          LOWER(maintenance.tipoMantenimiento) LIKE :term0)`,
        { term0: `%${searchTerms[0]}%` },
      );

      // Términos adicionales con AND + OR - incluir marca del vehículo
      for (let i = 1; i < searchTerms.length; i++) {
        query.andWhere(
          `(LOWER(vehicle.modelo) LIKE :term${i} OR
            LOWER(vehicle.placa) LIKE :term${i} OR
            LOWER(vehicle.marca) LIKE :term${i} OR
            LOWER(maintenance.descripcion) LIKE :term${i} OR
            LOWER(maintenance.tipoMantenimiento) LIKE :term${i})`,
          { [`term${i}`]: `%${searchTerms[i]}%` },
        );
      }
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
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

    // Usar query builder para manejar correctamente el ordenamiento con valores null
    return this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.vehicle', 'vehicle')
      .where('maintenance.vehiculoId = :vehiculoId', { vehiculoId })
      .orderBy('maintenance.fechaMantenimiento', 'DESC', 'NULLS LAST')
      .getMany();
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
        ResourceState.MANTENIMIENTO,
      );
    }
  }
}
