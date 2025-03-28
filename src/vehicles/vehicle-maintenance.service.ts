import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { VehicleMaintenanceRecord } from './entities/vehicle-maintenance-record.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { VehiclesService } from './vehicles.service';

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

    const maintenanceRecord =
      this.maintenanceRepository.create(createMaintenanceDto);
    maintenanceRecord.vehicle = vehicle;

    return this.maintenanceRepository.save(maintenanceRecord);
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
