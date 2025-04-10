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

    // Verificar si el vehículo está disponible
    if ((vehicle.estado as ResourceState) !== ResourceState.DISPONIBLE) {
      throw new BadRequestException(
        `El vehículo no está disponible para mantenimiento. Estado actual: ${vehicle.estado}`,
      );
    }

    // Cambiar el estado del vehículo a EN_MANTENIMIENTO
    await this.vehiclesService.changeStatus(
      vehicle.id,
      ResourceState.EN_MANTENIMIENTO,
    );

    // Recargar el vehículo con su estado actualizado
    const updatedVehicle = await this.vehiclesService.findOne(vehicle.id);

    const maintenanceRecord =
      this.maintenanceRepository.create(createMaintenanceDto);
    maintenanceRecord.vehicle = updatedVehicle;

    return this.maintenanceRepository.save(maintenanceRecord);
  }

  // Método para completar un mantenimiento y devolver el vehículo a DISPONIBLE
  async completeMaintenace(id: number): Promise<VehicleMaintenanceRecord> {
    const record = await this.findOne(id);

    // Marcar el mantenimiento como completado (agregar campo completado si no existe)
    record.completado = true;
    record.fechaCompletado = new Date();

    // Cambiar el estado del vehículo a DISPONIBLE
    await this.vehiclesService.changeStatus(
      record.vehiculoId,
      ResourceState.DISPONIBLE,
    );

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
