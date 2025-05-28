import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
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

    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      queryBuilder.where(
        `(LOWER(UNACCENT(vehicle.placa)) LIKE :searchTerm
        OR LOWER(UNACCENT(vehicle.marca)) LIKE :searchTerm
        OR LOWER(UNACCENT(vehicle.modelo)) LIKE :searchTerm
        OR LOWER(UNACCENT(vehicle.estado)) LIKE :searchTerm)`,
        { searchTerm: `%${search.toLowerCase()}%` },
      );

      // Add additional terms as separate AND conditions
      for (let i = 1; i < searchTerms.length; i++) {
        queryBuilder.andWhere(
          `(LOWER(UNACCENT(vehicle.placa)) LIKE :searchTerm${i}
          OR LOWER(UNACCENT(vehicle.marca)) LIKE :searchTerm${i}
          OR LOWER(UNACCENT(vehicle.modelo)) LIKE :searchTerm${i}
          OR LOWER(UNACCENT(vehicle.estado)) LIKE :searchTerm${i})`,
          { [`searchTerm${i}`]: `%${searchTerms[i]}%` },
        );
      }
    }

    queryBuilder.orderBy('vehicle.id', 'ASC');

    const [vehicles, total] = await Promise.all([
      queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getMany(),
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

  async remove(id: number): Promise<{ message: string }> {
    this.logger.log(`Eliminando vehículo con id: ${id}`);
    const vehicle = await this.findOne(id);

    // Check if the vehicle is assigned to any active service
    const vehicleWithAssignments = await this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect(
        'asignacion_recursos',
        'asignacion',
        'asignacion.vehiculo_id = vehicle.id',
      )
      .leftJoinAndSelect(
        'servicios',
        'servicio',
        'asignacion.servicio_id = servicio.servicio_id',
      )
      .where('vehicle.id = :id', { id })
      .andWhere('asignacion.vehiculo_id IS NOT NULL')
      .getOne();

    if (vehicleWithAssignments) {
      throw new BadRequestException(
        `El vehículo no puede ser eliminado ya que se encuentra asignado a uno o más servicios.`,
      );
    }

    // Check if the vehicle has scheduled maintenance
    if (
      vehicle.maintenanceRecords &&
      vehicle.maintenanceRecords.some((record) => !record.completado)
    ) {
      throw new BadRequestException(
        `El vehículo no puede ser eliminado ya que tiene mantenimientos programados pendientes.`,
      );
    }

    await this.vehicleRepository.remove(vehicle);

    return { message: `El vehículo id: ${id} ha sido eliminado correctamente` };
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

  async getTotalVehicles(): Promise<{
    total: number;
    totalDisponibles: number;
    totalMantenimiento: number;
    totalAsignado: number;
  }> {
    const total = await this.vehicleRepository.count();
    const totalDisponibles = await this.vehicleRepository.count({
      where: { estado: ResourceState.DISPONIBLE },
    });
    const totalMantenimiento = await this.vehicleRepository.count({
      where: { estado: ResourceState.MANTENIMIENTO },
    });
    const totalAsignado = await this.vehicleRepository.count({
      where: { estado: ResourceState.ASIGNADO },
    });
    return {
      total,
      totalDisponibles,
      totalMantenimiento,
      totalAsignado,
    };
  }
  async getExpiringDocuments(
    days: number = 30,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    segurosProximosAVencer: {
      data: Vehicle[];
      totalItems: number;
      currentPage: number;
      totalPages: number;
    };
    vtvProximosAVencer: {
      data: Vehicle[];
      totalItems: number;
      currentPage: number;
      totalPages: number;
    };
  }> {
    this.logger.log(
      `Buscando vehículos con seguros y VTV próximos a vencer en ${days} días (página ${page}, límite ${limit})`,
    );

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    // Base query para seguros próximos a vencer
    const segurosQueryBuilder = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.fechaVencimientoSeguro IS NOT NULL')
      .andWhere(
        'vehicle.fechaVencimientoSeguro BETWEEN :today AND :futureDate',
        {
          today: today.toISOString().split('T')[0],
          futureDate: futureDate.toISOString().split('T')[0],
        },
      )
      .orderBy('vehicle.fechaVencimientoSeguro', 'ASC');

    // Obtener total de seguros próximos a vencer
    const totalSeguros = await segurosQueryBuilder.getCount();

    // Obtener seguros paginados
    const segurosProximosAVencer = await segurosQueryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Base query para VTV próximos a vencer
    const vtvQueryBuilder = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.fechaVencimientoVTV IS NOT NULL')
      .andWhere('vehicle.fechaVencimientoVTV BETWEEN :today AND :futureDate', {
        today: today.toISOString().split('T')[0],
        futureDate: futureDate.toISOString().split('T')[0],
      })
      .orderBy('vehicle.fechaVencimientoVTV', 'ASC');

    // Obtener total de VTV próximos a vencer
    const totalVtv = await vtvQueryBuilder.getCount();

    // Obtener VTV paginados
    const vtvProximosAVencer = await vtvQueryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      segurosProximosAVencer: {
        data: segurosProximosAVencer,
        totalItems: totalSeguros,
        currentPage: page,
        totalPages: Math.ceil(totalSeguros / limit),
      },
      vtvProximosAVencer: {
        data: vtvProximosAVencer,
        totalItems: totalVtv,
        currentPage: page,
        totalPages: Math.ceil(totalVtv / limit),
      },
    };
  }
}
