import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import {
  CreateServiceDto,
  ResourceAssignmentDto,
} from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { ClientService } from '../clients/clients.service';
import { EmployeesService } from '../employees/employees.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import {
  ResourceState,
  ServiceState,
} from '../common/enums/resource-states.enum';
import { Empleado } from '../employees/entities/employee.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ResourceAssignment)
    private assignmentRepository: Repository<ResourceAssignment>,
    private clientsService: ClientService,
    private employeesService: EmployeesService,
    private vehiclesService: VehiclesService,
    private toiletsService: ChemicalToiletsService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    this.logger.log(
      `Creando nuevo servicio para cliente: ${createServiceDto.clienteId}`,
    );

    // Verificar que el cliente existe
    await this.clientsService.findOneClient(createServiceDto.clienteId);

    // Crear el servicio con los datos del DTO
    const newService = new Service();
    newService.clienteId = createServiceDto.clienteId;
    newService.fechaProgramada = new Date(createServiceDto.fechaProgramada);

    // Use default values instead of undefined
    newService.fechaInicio = createServiceDto.fechaInicio
      ? new Date(createServiceDto.fechaInicio)
      : null; // Set to null when not provided

    newService.fechaFin = createServiceDto.fechaFin
      ? new Date(createServiceDto.fechaFin)
      : null; // Set to null when not provided

    newService.tipoServicio = createServiceDto.tipoServicio;
    newService.estado =
      createServiceDto.estado || ServiceState.PENDIENTE_RECURSOS;
    newService.cantidadBanos = createServiceDto.cantidadBanos;
    newService.ubicacion = createServiceDto.ubicacion;
    newService.notas = createServiceDto.notas || '';
    newService.asignacionAutomatica = createServiceDto.asignacionAutomatica;

    // Guardar el servicio para obtener el ID
    const savedService = await this.serviceRepository.save(newService);

    // Asignar recursos (automáticos o manuales)
    if (createServiceDto.asignacionAutomatica) {
      await this.assignResourcesAutomatically(savedService);
    } else if (createServiceDto.asignacionesManual?.length) {
      await this.assignResourcesManually(
        savedService.id,
        createServiceDto.asignacionesManual,
      );
    }

    // Actualizar estado del servicio
    if (savedService.asignaciones?.length > 0) {
      savedService.estado = ServiceState.PROGRAMADO;
      await this.serviceRepository.save(savedService);
    }

    // Retornar el servicio completo con sus asignaciones
    return this.findOne(savedService.id);
  }

  async findAll(filters?: FilterServicesDto): Promise<Service[]> {
    this.logger.log('Recuperando todos los servicios');

    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.asignaciones', 'asignacion')
      .leftJoinAndSelect('service.cliente', 'cliente')
      .leftJoinAndSelect('asignacion.empleado', 'empleado')
      .leftJoinAndSelect('asignacion.vehiculo', 'vehiculo')
      .leftJoinAndSelect('asignacion.bano', 'bano');

    if (filters) {
      if (filters.clienteId) {
        queryBuilder.andWhere('service.clienteId = :clienteId', {
          clienteId: filters.clienteId,
        });
      }

      if (filters.estado) {
        queryBuilder.andWhere('service.estado = :estado', {
          estado: filters.estado,
        });
      }

      if (filters.tipoServicio) {
        queryBuilder.andWhere('service.tipoServicio = :tipoServicio', {
          tipoServicio: filters.tipoServicio,
        });
      }

      if (filters.ubicacion) {
        queryBuilder.andWhere('service.ubicacion LIKE :ubicacion', {
          ubicacion: `%${filters.ubicacion}%`,
        });
      }

      if (filters.fechaDesde) {
        queryBuilder.andWhere('service.fechaProgramada >= :fechaDesde', {
          fechaDesde: new Date(filters.fechaDesde),
        });
      }

      if (filters.fechaHasta) {
        queryBuilder.andWhere('service.fechaProgramada <= :fechaHasta', {
          fechaHasta: new Date(filters.fechaHasta),
        });
      }
    }

    queryBuilder.orderBy('service.fechaProgramada', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Service> {
    this.logger.log(`Buscando servicio con id: ${id}`);

    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.empleado',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
    });

    if (!service) {
      throw new NotFoundException(`Servicio con id ${id} no encontrado`);
    }

    return service;
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    this.logger.log(`Actualizando servicio con id: ${id}`);

    const service = await this.findOne(id);

    // Si cambia el cliente, verificar que existe
    if (
      updateServiceDto.clienteId &&
      updateServiceDto.clienteId !== service.clienteId
    ) {
      await this.clientsService.findOneClient(updateServiceDto.clienteId);
    }

    // Convertir fechas si existen
    if (updateServiceDto.fechaProgramada) {
      updateServiceDto.fechaProgramada = new Date(
        updateServiceDto.fechaProgramada,
      ).toISOString();
    }

    if (updateServiceDto.fechaInicio) {
      updateServiceDto.fechaInicio = new Date(
        updateServiceDto.fechaInicio,
      ).toISOString();
    }

    if (updateServiceDto.fechaFin) {
      updateServiceDto.fechaFin = new Date(
        updateServiceDto.fechaFin,
      ).toISOString();
    }

    // Si el servicio ya tenía recursos asignados y se va a cambiar, liberarlos primero
    const needsResourceReassignment =
      updateServiceDto.asignacionAutomatica !== undefined ||
      updateServiceDto.asignacionesManual !== undefined;

    if (needsResourceReassignment && service.asignaciones?.length) {
      await this.releaseAssignedResources(service);
      await this.assignmentRepository.remove(service.asignaciones);
    }

    // Actualizar los datos básicos del servicio
    Object.assign(service, updateServiceDto);

    // Guardar los cambios básicos
    const updatedService = await this.serviceRepository.save(service);

    // Realizar nuevas asignaciones si es necesario
    if (needsResourceReassignment) {
      if (updateServiceDto.asignacionAutomatica) {
        await this.assignResourcesAutomatically(updatedService);
      } else if (updateServiceDto.asignacionesManual?.length) {
        await this.assignResourcesManually(
          id,
          updateServiceDto.asignacionesManual,
        );
      }

      // Actualizar estado del servicio
      if (updatedService.asignaciones?.length > 0) {
        updatedService.estado = ServiceState.PROGRAMADO;
      } else {
        updatedService.estado = ServiceState.PENDIENTE_RECURSOS;
      }

      await this.serviceRepository.save(updatedService);
    }

    // Retornar el servicio actualizado con todas sus relaciones
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Eliminando servicio con id: ${id}`);

    const service = await this.findOne(id);

    // Liberar recursos asignados
    if (service.asignaciones?.length) {
      await this.releaseAssignedResources(service);
    }

    // Eliminar el servicio (las asignaciones se eliminarán en cascada)
    await this.serviceRepository.remove(service);
  }

  async changeStatus(id: number, nuevoEstado: ServiceState): Promise<Service> {
    this.logger.log(`Cambiando estado del servicio ${id} a ${nuevoEstado}`);

    const service = await this.findOne(id);

    // Validar transiciones de estado
    this.validateStatusTransition(service.estado, nuevoEstado);

    // Actualizar fechas según el cambio de estado
    if (nuevoEstado === ServiceState.EN_PROGRESO && !service.fechaInicio) {
      service.fechaInicio = new Date();
    }

    if (nuevoEstado === ServiceState.COMPLETADO && !service.fechaFin) {
      service.fechaFin = new Date();
    }

    // Si se cancela o completa el servicio, liberar los recursos
    if (
      nuevoEstado === ServiceState.CANCELADO ||
      nuevoEstado === ServiceState.COMPLETADO
    ) {
      await this.releaseAssignedResources(service);
    }

    // Actualizar el estado
    service.estado = nuevoEstado;
    return this.serviceRepository.save(service);
  }

  private async assignResourcesAutomatically(service: Service): Promise<void> {
    try {
      // 1. Asignar empleados disponibles (al menos 1)
      const availableEmployees = await this.findAvailableEmployees(
        service.fechaProgramada,
      );

      if (availableEmployees.length === 0) {
        throw new BadRequestException(
          'No hay empleados disponibles para la fecha programada',
        );
      }

      // 2. Asignar vehículo disponible (1)
      const availableVehicles = await this.findAvailableVehicles(
        service.fechaProgramada,
      );

      if (availableVehicles.length === 0) {
        throw new BadRequestException(
          'No hay vehículos disponibles para la fecha programada',
        );
      }

      // 3. Asignar baños químicos disponibles (según cantidadBanos)
      const availableToilets = await this.findAvailableToilets(
        service.fechaProgramada,
        service.cantidadBanos,
      );

      if (availableToilets.length < service.cantidadBanos) {
        throw new BadRequestException(
          `No hay suficientes baños disponibles. Se requieren ${service.cantidadBanos}, pero solo hay ${availableToilets.length}`,
        );
      }

      // 4. Crear las asignaciones - Usamos el primer empleado y vehículo disponibles
      const selectedEmployee = availableEmployees[0];
      const selectedVehicle = availableVehicles[0];

      // Cambiar estados de los recursos seleccionados
      await this.updateResourceState(selectedEmployee, ResourceState.ASIGNADO);
      await this.updateVehicleState(selectedVehicle, ResourceState.ASIGNADO);

      // Crear asignaciones para cada baño necesario
      const assignments: ResourceAssignment[] = [];

      // Para el primer baño creamos la asignación con empleado y vehículo
      const firstAssignment = new ResourceAssignment();
      firstAssignment.servicio = service;
      firstAssignment.empleado = selectedEmployee;
      firstAssignment.vehiculo = selectedVehicle;
      firstAssignment.bano = availableToilets[0];

      assignments.push(firstAssignment);
      await this.updateToiletState(availableToilets[0], ResourceState.ASIGNADO);

      // Para el resto de baños solo asignamos el baño
      for (let i = 1; i < service.cantidadBanos; i++) {
        const toiletAssignment = new ResourceAssignment();
        toiletAssignment.servicio = service;
        toiletAssignment.bano = availableToilets[i];

        assignments.push(toiletAssignment);
        await this.updateToiletState(
          availableToilets[i],
          ResourceState.ASIGNADO,
        );
      }

      // Guardar todas las asignaciones
      await this.assignmentRepository.save(assignments);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error al asignar recursos automáticamente: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async assignResourcesManually(
    serviceId: number,
    assignmentDtos: ResourceAssignmentDto[],
  ): Promise<void> {
    const service = await this.findOne(serviceId);

    try {
      // Verificar que el servicio existe
      const assignments: ResourceAssignment[] = [];

      // Procesar cada asignación manual
      for (const assignmentDto of assignmentDtos) {
        // Verificar empleado
        let employee: Empleado | null = null;
        if (assignmentDto.empleadoId) {
          employee = await this.employeesService.findOne(
            assignmentDto.empleadoId,
          );
          if (employee.estado !== ResourceState.DISPONIBLE.toString()) {
            throw new BadRequestException(
              `El empleado con ID ${employee.id} no está disponible`,
            );
          }
          await this.updateResourceState(employee, ResourceState.ASIGNADO);
        }

        // Verificar vehículo
        let vehicle: Vehicle | null = null;
        if (assignmentDto.vehiculoId) {
          vehicle = await this.vehiclesService.findOne(
            assignmentDto.vehiculoId,
          );
          if (vehicle.estado !== ResourceState.DISPONIBLE.toString()) {
            throw new BadRequestException(
              `El vehículo con ID ${vehicle.id} no está disponible`,
            );
          }
          await this.updateVehicleState(vehicle, ResourceState.ASIGNADO);
        }

        // Verificar baños
        if (assignmentDto.banosIds && assignmentDto.banosIds.length > 0) {
          for (const toiletId of assignmentDto.banosIds) {
            const toilet = await this.toiletsService.findById(toiletId);
            if (toilet.estado !== ResourceState.DISPONIBLE.toString()) {
              throw new BadRequestException(
                `El baño con ID ${toilet.baño_id} no está disponible`,
              );
            }

            const toiletAssignment = new ResourceAssignment();
            toiletAssignment.servicio = service;
            toiletAssignment.empleado = employee;
            toiletAssignment.vehiculo = vehicle;
            toiletAssignment.bano = toilet;

            assignments.push(toiletAssignment);
            await this.updateToiletState(toilet, ResourceState.ASIGNADO);
          }
        } else {
          // Si no hay baños específicos pero sí hay empleado o vehículo,
          // creamos una asignación sin baño
          if (employee || vehicle) {
            const emptyAssignment = new ResourceAssignment();
            emptyAssignment.servicio = service;
            emptyAssignment.empleado = employee;
            emptyAssignment.vehiculo = vehicle;

            assignments.push(emptyAssignment);
          }
        }
      }

      // Verificar que el número de baños asignados sea al menos igual a la cantidad requerida
      const assignedToilets = assignments.filter((a) => a.bano).length;
      if (assignedToilets < service.cantidadBanos) {
        throw new BadRequestException(
          `Se requieren ${service.cantidadBanos} baños, pero solo se asignaron ${assignedToilets}`,
        );
      }

      // Guardar todas las asignaciones
      await this.assignmentRepository.save(assignments);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error al asignar recursos manualmente: ${errorMessage}`,
      );
      throw error;
    }
  }

  private async releaseAssignedResources(service: Service): Promise<void> {
    // Cargar las asignaciones si no se han cargado ya
    if (!service.asignaciones) {
      service.asignaciones = await this.assignmentRepository.find({
        where: { servicioId: service.id },
        relations: ['empleado', 'vehiculo', 'bano'],
      });
    }

    // Recorrer todas las asignaciones y liberar cada recurso
    for (const assignment of service.asignaciones) {
      if (assignment.empleado) {
        await this.updateResourceState(
          assignment.empleado,
          ResourceState.DISPONIBLE,
        );
      }

      if (assignment.vehiculo) {
        await this.updateVehicleState(
          assignment.vehiculo,
          ResourceState.DISPONIBLE,
        );
      }

      if (assignment.bano) {
        await this.updateToiletState(assignment.bano, ResourceState.DISPONIBLE);
      }
    }
  }

  private async findAvailableEmployees(date: Date): Promise<Empleado[]> {
    // Buscar empleados disponibles que no estén ya asignados a otro servicio en la misma fecha
    const busyEmployeeIds = await this.getBusyResourceIds('empleado_id', date);

    // Obtener empleados disponibles
    const availableEmployees = await this.employeesService.findAll();

    return availableEmployees.filter(
      (employee) =>
        employee.estado === ResourceState.DISPONIBLE.toString() &&
        !busyEmployeeIds.includes(employee.id),
    );
  }

  private async findAvailableVehicles(date: Date): Promise<Vehicle[]> {
    // Buscar vehículos que no estén asignados a otro servicio en la misma fecha
    const busyVehicleIds = await this.getBusyResourceIds('vehiculo_id', date);

    // Obtener vehículos disponibles
    const availableVehicles = await this.vehiclesService.findAll();

    return availableVehicles.filter(
      (vehicle) =>
        vehicle.estado === ResourceState.DISPONIBLE.toString() &&
        !busyVehicleIds.includes(vehicle.id),
    );
  }

  private async findAvailableToilets(
    date: Date,
    count: number,
  ): Promise<ChemicalToilet[]> {
    // Buscar baños que no estén asignados a otro servicio en la misma fecha
    const busyToiletIds = await this.getBusyResourceIds('bano_id', date);

    // Obtener baños disponibles
    const allToilets = await this.toiletsService.findAll();
    const availableToilets = allToilets.filter(
      (toilet) =>
        toilet.estado === 'DISPONIBLE' &&
        !busyToiletIds.includes(toilet.baño_id),
    );

    return availableToilets.slice(0, count); // Limitar al número solicitado
  }

  private async getBusyResourceIds(
    resourceField: 'empleado_id' | 'vehiculo_id' | 'bano_id',
    date: Date,
  ): Promise<number[]> {
    // Obtener recursos ocupados en la fecha indicada
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const busyResources = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .innerJoin('assignment.servicio', 'service')
      .where(`service.fechaProgramada BETWEEN :startOfDay AND :endOfDay`, {
        startOfDay,
        endOfDay,
      })
      .andWhere(`service.estado NOT IN (:...completedStates)`, {
        completedStates: [ServiceState.COMPLETADO, ServiceState.CANCELADO],
      })
      .andWhere(`assignment.${resourceField} IS NOT NULL`)
      .select(`assignment.${resourceField}`)
      .getRawMany();

    // Type-safe mapping of raw query results
    return busyResources.map((r: Record<string, number>) => {
      const value = r[resourceField];
      if (typeof value === 'number') {
        return value;
      }
      // In case the database returns string IDs, convert them to numbers
      return parseInt(String(value), 10);
    });
  }

  private async updateResourceState(
    employee: Empleado,
    newState: ResourceState,
  ): Promise<void> {
    await this.employeesService.changeStatus(employee.id, newState);
  }

  private async updateVehicleState(
    vehicle: Vehicle,
    newState: ResourceState,
  ): Promise<void> {
    await this.vehiclesService.changeStatus(vehicle.id, newState);
  }

  private async updateToiletState(
    toilet: ChemicalToilet,
    newState: ResourceState,
  ): Promise<void> {
    await this.toiletsService.update(toilet.baño_id, { estado: newState });
  }

  private validateStatusTransition(
    currentState: ServiceState,
    newState: ServiceState,
  ): void {
    // Definir las transiciones válidas
    const validTransitions: Record<ServiceState, ServiceState[]> = {
      [ServiceState.PENDIENTE_RECURSOS]: [
        ServiceState.PROGRAMADO,
        ServiceState.CANCELADO,
      ],
      [ServiceState.PENDIENTE_CONFIRMACION]: [
        ServiceState.PROGRAMADO,
        ServiceState.CANCELADO,
      ],
      [ServiceState.PROGRAMADO]: [
        ServiceState.EN_PROGRESO,
        ServiceState.CANCELADO,
        ServiceState.SUSPENDIDO,
      ],
      [ServiceState.EN_PROGRESO]: [
        ServiceState.COMPLETADO,
        ServiceState.SUSPENDIDO,
      ],
      [ServiceState.SUSPENDIDO]: [
        ServiceState.EN_PROGRESO,
        ServiceState.CANCELADO,
      ],
      [ServiceState.COMPLETADO]: [], // Estado final
      [ServiceState.CANCELADO]: [], // Estado final
    };

    // Verificar si la transición es válida
    if (!validTransitions[currentState]?.includes(newState)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de ${currentState} a ${newState}`,
      );
    }
  }
}
