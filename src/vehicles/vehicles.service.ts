import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create_vehicle.dto';
import { UpdateVehicleDto } from './dto/update_vehicle.dto';
import { ResourceState } from '../common/enums/resource-states.enum';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>, // Asegurarse de que se llama 'vehicleRepository' aquí
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    this.logger.log(`Creando vehículo con placa: ${createVehicleDto.placa}`);

    // Verificar si ya existe un vehículo con la misma placa
    const existingVehicle = await this.vehicleRepository.findOne({
      where: { placa: createVehicleDto.placa },
    });

    if (existingVehicle) {
      throw new ConflictException(
        `Ya existe un vehículo con la placa ${createVehicleDto.placa}`,
      );
    }

    const vehicle = this.vehicleRepository.create(createVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async findAll(page = 1, limit = 10, search?: string): Promise<any> {
    this.logger.log('Recuperando todos los vehículos');

    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle'); // Aquí corregimos 'vehiclesRepository' por 'vehicleRepository'

    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      queryBuilder.where('LOWER(vehicle.estado) LIKE :searchTerm', { searchTerm });
    }

    queryBuilder.orderBy('vehicle.vehiculo_id', 'ASC');

    const [vehicles, total] = await Promise.all([
      queryBuilder.skip((page - 1) * limit).take(limit).getMany(),
      queryBuilder.getCount(),
    ]);

    return {
      data: vehicles,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Vehicle> {
    this.logger.log(`Buscando vehículo con id: ${id}`);
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['maintenanceRecords'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo con id ${id} no encontrado`);
    }

    return vehicle;
  }

  async findByPlaca(placa: string): Promise<Vehicle> {
    this.logger.log(`Buscando vehículo con placa: ${placa}`);
    const vehicle = await this.vehicleRepository.findOne({
      where: { placa },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo con placa ${placa} no encontrado`);
    }

    return vehicle;
  }

  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    this.logger.log(`Actualizando vehículo con id: ${id}`);
    const vehicle = await this.findOne(id);

    // Si la placa se está actualizando, verificar que no exista otra con esa placa
    if (updateVehicleDto.placa && updateVehicleDto.placa !== vehicle.placa) {
      const existingVehicle = await this.vehicleRepository.findOne({
        where: { placa: updateVehicleDto.placa },
      });

      if (existingVehicle) {
        throw new ConflictException(
          `Ya existe un vehículo con la placa ${updateVehicleDto.placa}`,
        );
      }
    }

    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Eliminando vehículo con id: ${id}`);
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.remove(vehicle);
  }

  async changeStatus(id: number, estado: string): Promise<Vehicle> {
    this.logger.log(`Cambiando estado del vehículo ${id} a ${estado}`);
    const vehicle = await this.findOne(id);
    vehicle.estado = estado;
    return this.vehicleRepository.save(vehicle);
  }

  async findByEstado(estado: ResourceState): Promise<Vehicle[]> {
    this.logger.log(`Buscando vehículos con estado: ${estado}`);
    return this.vehicleRepository.find({
      where: { estado },
    });
  }
}
