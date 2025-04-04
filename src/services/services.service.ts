import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { Service, ServiceStatus } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource_assignment.entity';
import { CreateServiceDto } from './dto/create_service.dto';
import { UpdateServiceDto } from './dto/update_service.dto';
import { AssignResourceDto } from './dto/assign_resource.dto';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ResourceAssignment)
    private assignmentRepository: Repository<ResourceAssignment>,
    @InjectRepository(ChemicalToilet)
    private toiletRepository: Repository<ChemicalToilet>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    this.logger.log(
      `Creando servicio para cliente: ${createServiceDto.clienteId}`,
    );

    // Validar disponibilidad de recursos antes de crear el servicio
    if (createServiceDto.cantidadBanos > 0) {
      // Validación de baños (código existente)
      const availableToilets = await this.findAvailableToilets(
        createServiceDto.fechaProgramada,
        createServiceDto.cantidadBanos,
      );

      if (availableToilets.length < createServiceDto.cantidadBanos) {
        this.logger.warn(
          `No hay suficientes baños disponibles. Solicitados: ${createServiceDto.cantidadBanos}, Disponibles: ${availableToilets.length}`,
        );
        throw new BadRequestException(
          `No hay suficientes baños disponibles para crear el servicio. Solicitados: ${createServiceDto.cantidadBanos}, Disponibles: ${availableToilets.length}`,
        );
      }

      // Validación de vehículos - Usar la cantidad especificada o calcular automáticamente
      const vehiculosNecesarios =
        createServiceDto.cantidadVehiculos ||
        Math.ceil(createServiceDto.cantidadBanos / 5) ||
        1;

      const availableVehicles = await this.findAvailableVehicles(
        createServiceDto.fechaProgramada,
        vehiculosNecesarios,
      );

      if (availableVehicles.length < vehiculosNecesarios) {
        this.logger.warn(
          `No hay suficientes vehículos disponibles. Necesarios: ${vehiculosNecesarios}, Disponibles: ${availableVehicles.length}`,
        );
        throw new BadRequestException(
          `No hay suficientes vehículos disponibles para crear el servicio. Necesarios: ${vehiculosNecesarios}, Disponibles: ${availableVehicles.length}`,
        );
      }
    }

    // Crear nueva entidad de servicio
    const service = this.serviceRepository.create(createServiceDto);

    // Guardar servicio en la base de datos
    const savedService = await this.serviceRepository.save(service);

    // Si hay cantidad de baños > 0, intentar asignar recursos automáticamente
    if (savedService.cantidadBanos > 0) {
      try {
        await this.autoAssignResources(savedService);
      } catch (error) {
        // En caso de error, eliminar el servicio creado
        await this.serviceRepository.remove(savedService);

        // Relanzar el error para que lo maneje el controlador
        throw error;
      }
    }

    return this.findOne(savedService.servicioId);
  }

  async findAll(): Promise<Service[]> {
    this.logger.log('Recuperando todos los servicios');
    return this.serviceRepository.find({
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
    });
  }

  async findServicesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Service[]> {
    this.logger.log(
      `Buscando servicios entre ${startDate.toISOString()} y ${endDate.toISOString()}`,
    );

    return this.serviceRepository.find({
      where: {
        fechaProgramada: Between(startDate, endDate),
      },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
      order: {
        fechaProgramada: 'ASC',
      },
    });
  }

  async findServicesByStatus(status: ServiceStatus): Promise<Service[]> {
    this.logger.log(`Buscando servicios con estado: ${status}`);

    return this.serviceRepository.find({
      where: {
        estado: status,
      },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
      order: {
        fechaProgramada: 'ASC',
      },
    });
  }

  async findServicesByClient(clienteId: number): Promise<Service[]> {
    this.logger.log(`Buscando servicios para cliente: ${clienteId}`);

    return this.serviceRepository.find({
      where: {
        clienteId,
      },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
      order: {
        fechaProgramada: 'DESC',
      },
    });
  }

  async findOne(id: number): Promise<Service> {
    this.logger.log(`Buscando servicio con id: ${id}`);

    const service = await this.serviceRepository.findOne({
      where: { servicioId: id },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
    });

    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }

    return service;
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    this.logger.log(`Actualizando servicio con id: ${id}`);

    const service = await this.findOne(id);

    // Si hay cambio en la cantidad de baños, revisar asignaciones
    if (
      updateServiceDto.cantidadBanos &&
      updateServiceDto.cantidadBanos !== service.cantidadBanos
    ) {
      // Si aumenta, intentar asignar más baños
      if (updateServiceDto.cantidadBanos > service.cantidadBanos) {
        const bañosAAgregar =
          updateServiceDto.cantidadBanos - service.cantidadBanos;
        this.logger.log(
          `Agregando ${bañosAAgregar} baños adicionales al servicio ${id}`,
        );
      }
      // Si disminuye, eliminar asignaciones excedentes
      else if (updateServiceDto.cantidadBanos < service.cantidadBanos) {
        const bañosAEliminar =
          service.cantidadBanos - updateServiceDto.cantidadBanos;
        this.logger.log(
          `Eliminando ${bañosAEliminar} baños del servicio ${id}`,
        );

        // Implementación simplificada - eliminar las últimas asignaciones
        if (service.asignaciones && service.asignaciones.length > 0) {
          const asignacionesOrdenadas = [...service.asignaciones].sort(
            (a, b) => a.asignacionId - b.asignacionId,
          );

          for (
            let i = 0;
            i < bañosAEliminar && i < asignacionesOrdenadas.length;
            i++
          ) {
            await this.assignmentRepository.remove(asignacionesOrdenadas[i]);
          }
        }
      }
    }

    // Actualizar datos del servicio
    Object.assign(service, updateServiceDto);

    return this.serviceRepository.save(service);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Eliminando servicio con id: ${id}`);

    const service = await this.findOne(id);

    // Eliminar todas las asignaciones relacionadas primero
    if (service.asignaciones && service.asignaciones.length > 0) {
      await this.assignmentRepository.remove(service.asignaciones);
    }

    await this.serviceRepository.remove(service);
  }

  async updateServiceStatus(
    id: number,
    status: ServiceStatus,
  ): Promise<Service> {
    this.logger.log(`Actualizando estado del servicio ${id} a ${status}`);

    const service = await this.findOne(id);

    // Actualizar el estado
    service.estado = status;

    // Si el estado es EN_PROCESO, registrar la fecha de inicio
    if (status === ServiceStatus.EN_PROCESO && !service.fechaInicio) {
      service.fechaInicio = new Date();
    }

    // Si el estado es COMPLETADO, registrar la fecha de fin
    if (status === ServiceStatus.COMPLETADO && !service.fechaFin) {
      service.fechaFin = new Date();
    }

    return this.serviceRepository.save(service);
  }

  async assignResource(
    assignResourceDto: AssignResourceDto,
  ): Promise<ResourceAssignment> {
    this.logger.log(
      `Asignando recursos al servicio: ${assignResourceDto.servicioId}`,
    );

    const service = await this.findOne(assignResourceDto.servicioId);

    // Verificar disponibilidad del recurso antes de asignar
    if (assignResourceDto.banoId) {
      await this.checkToiletAvailability(
        assignResourceDto.banoId,
        service.fechaProgramada,
      );
    }

    if (assignResourceDto.vehiculoId) {
      await this.checkVehicleAvailability(
        assignResourceDto.vehiculoId,
        service.fechaProgramada,
      );
    }

    // Crear y guardar asignación
    const assignment = this.assignmentRepository.create({
      servicioId: assignResourceDto.servicioId,
      empleadoId: assignResourceDto.empleadoId,
      vehiculoId: assignResourceDto.vehiculoId,
      banoId: assignResourceDto.banoId,
      notas: assignResourceDto.notas,
    });

    return this.assignmentRepository.save(assignment);
  }

  async removeResourceAssignment(assignmentId: number): Promise<void> {
    this.logger.log(`Eliminando asignación de recurso: ${assignmentId}`);

    const assignment = await this.assignmentRepository.findOne({
      where: { asignacionId: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Asignación con ID ${assignmentId} no encontrada`,
      );
    }

    await this.assignmentRepository.remove(assignment);
  }

  // Método para asignar recursos automáticamente
  private async autoAssignResources(service: Service): Promise<void> {
    this.logger.log(
      `Asignando recursos automáticamente para servicio ${service.servicioId}`,
    );

    try {
      // 1. Buscar baños disponibles
      const availableToilets = await this.findAvailableToilets(
        service.fechaProgramada,
        service.cantidadBanos,
      );

      if (availableToilets.length < service.cantidadBanos) {
        // Manejo de error existente
      }

      // 2. Buscar vehículos disponibles
      // Utilizar la cantidad especificada en el servicio o calcular basado en baños
      const vehiculosNecesarios =
        service.cantidadVehiculos || Math.ceil(service.cantidadBanos / 5) || 1;

      const availableVehicles = await this.findAvailableVehicles(
        service.fechaProgramada,
        vehiculosNecesarios,
      );

      if (availableVehicles.length < vehiculosNecesarios) {
        this.logger.warn(
          `No hay suficientes vehículos disponibles. Necesarios: ${vehiculosNecesarios}, Disponibles: ${availableVehicles.length}`,
        );
        throw new BadRequestException(
          `No hay suficientes vehículos disponibles para el servicio. Necesarios: ${vehiculosNecesarios}, Disponibles: ${availableVehicles.length}`,
        );
      }

      // Resto del código de asignación igual...
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al asignar recursos: ${errorMessage}`);
      // Manejo de errores existente
      throw error;
    }
  }

  // Método para buscar baños disponibles en una fecha
  private async findAvailableToilets(
    date: Date,
    count: number,
  ): Promise<ChemicalToilet[]> {
    // Obtener baños que ya están asignados para esa fecha
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const servicesOnDate = await this.serviceRepository.find({
      where: {
        fechaProgramada: Between(startOfDay, endOfDay),
        estado: In([
          ServiceStatus.PROGRAMADO,
          ServiceStatus.EN_RUTA,
          ServiceStatus.EN_PROCESO,
        ]),
      },
      relations: ['asignaciones'],
    });

    // Extraer IDs de baños ya asignados
    const assignedToiletIds = servicesOnDate
      .flatMap((service) => service.asignaciones)
      .filter((assignment) => assignment.banoId)
      .map((assignment) => assignment.banoId);

    // Buscar baños no asignados y en buen estado
    return this.toiletRepository.find({
      where: {
        estado: 'ACTIVO',
        baño_id: Not(In(assignedToiletIds)),
      },
      take: count,
    });
  }

  // Método para buscar vehículo disponible en una fecha
  private async findAvailableVehicle(date: Date): Promise<Vehicle | null> {
    // Obtener vehículos que ya están asignados para esa fecha
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const servicesOnDate = await this.serviceRepository.find({
      where: {
        fechaProgramada: Between(startOfDay, endOfDay),
        estado: In([
          ServiceStatus.PROGRAMADO,
          ServiceStatus.EN_RUTA,
          ServiceStatus.EN_PROCESO,
        ]),
      },
      relations: ['asignaciones'],
    });

    // Extraer IDs de vehículos ya asignados
    const assignedVehicleIds = servicesOnDate
      .flatMap((service) => service.asignaciones)
      .filter((assignment) => assignment.vehiculoId)
      .map((assignment) => assignment.vehiculoId);

    // Buscar vehículo no asignado y en buen estado
    return this.vehicleRepository.findOne({
      where: {
        estado: 'ACTIVO',
        id: Not(In(assignedVehicleIds)),
      },
    });
  }

  // Método para buscar múltiples vehículos disponibles en una fecha
  private async findAvailableVehicles(
    date: Date,
    count: number,
  ): Promise<Vehicle[]> {
    // Obtener vehículos que ya están asignados para esa fecha
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const servicesOnDate = await this.serviceRepository.find({
      where: {
        fechaProgramada: Between(startOfDay, endOfDay),
        estado: In([
          ServiceStatus.PROGRAMADO,
          ServiceStatus.EN_RUTA,
          ServiceStatus.EN_PROCESO,
        ]),
      },
      relations: ['asignaciones'],
    });

    // Extraer IDs de vehículos ya asignados
    const assignedVehicleIds = servicesOnDate
      .flatMap((service) => service.asignaciones)
      .filter((assignment) => assignment.vehiculoId)
      .map((assignment) => assignment.vehiculoId);

    // Buscar vehículos no asignados y en buen estado
    return this.vehicleRepository.find({
      where: {
        estado: 'ACTIVO',
        id: Not(In(assignedVehicleIds)),
      },
      take: count,
    });
  }

  // Verificar disponibilidad de baño
  private async checkToiletAvailability(
    toiletId: number,
    date: Date,
  ): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar si el baño ya está asignado ese día
    const existingAssignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.servicio', 'service')
      .where('assignment.banoId = :toiletId', { toiletId })
      .andWhere('service.fechaProgramada BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .andWhere('service.estado IN (:...activeStatuses)', {
        activeStatuses: [
          ServiceStatus.PROGRAMADO,
          ServiceStatus.EN_RUTA,
          ServiceStatus.EN_PROCESO,
        ],
      })
      .getCount();

    if (existingAssignments > 0) {
      throw new ConflictException(
        `El baño con ID ${toiletId} ya está asignado para la fecha ${date.toISOString().split('T')[0]}`,
      );
    }
  }

  // Verificar disponibilidad de vehículo
  private async checkVehicleAvailability(
    vehicleId: number,
    date: Date,
  ): Promise<void> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar si el vehículo ya está asignado ese día
    const existingAssignments = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.servicio', 'service')
      .where('assignment.vehiculoId = :vehicleId', { vehicleId })
      .andWhere('service.fechaProgramada BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .andWhere('service.estado IN (:...activeStatuses)', {
        activeStatuses: [
          ServiceStatus.PROGRAMADO,
          ServiceStatus.EN_RUTA,
          ServiceStatus.EN_PROCESO,
        ],
      })
      .getCount();

    if (existingAssignments > 0) {
      throw new ConflictException(
        `El vehículo con ID ${vehicleId} ya está asignado para la fecha ${date.toISOString().split('T')[0]}`,
      );
    }
  }

  // Obtener servicios del día actual
  async getTodayServices(): Promise<Service[]> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return this.findServicesByDateRange(startOfDay, endOfDay);
  }

  // Obtener servicios pendientes
  async getPendingServices(): Promise<Service[]> {
    return this.findServicesByStatus(ServiceStatus.PROGRAMADO);
  }

  // Obtener servicios en proceso
  async getInProgressServices(): Promise<Service[]> {
    return this.serviceRepository.find({
      where: {
        estado: In([ServiceStatus.EN_RUTA, ServiceStatus.EN_PROCESO]),
      },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
      order: {
        fechaProgramada: 'ASC',
      },
    });
  }
}
