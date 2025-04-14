import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, IsNull } from 'typeorm';
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
import { VehicleMaintenanceService } from '../vehicle_maintenance/vehicle_maintenance.service';
import { ToiletMaintenanceService } from '../toilet_maintenance/toilet_maintenance.service';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(ResourceAssignment)
    private assignmentRepository: Repository<ResourceAssignment>,
    @InjectRepository(Vehicle)
    private vehiclesRepository: Repository<Vehicle>,
    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,
    private clientsService: ClientService,
    private employeesService: EmployeesService,
    private vehiclesService: VehiclesService,
    private toiletsService: ChemicalToiletsService,
    private readonly vehicleMaintenanceService: VehicleMaintenanceService,
    private readonly toiletMaintenanceService: ToiletMaintenanceService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    this.logger.log(
      `Creando nuevo servicio para cliente: ${createServiceDto.clienteId}`,
    );

    // Verificar que el cliente existe
    await this.clientsService.findOneClient(createServiceDto.clienteId);

    // Crear el servicio
    const service = new Service();
    service.clienteId = createServiceDto.clienteId;
    service.fechaProgramada = new Date(createServiceDto.fechaProgramada);
    service.fechaInicio = createServiceDto.fechaInicio
      ? new Date(createServiceDto.fechaInicio)
      : null;
    service.fechaFin = createServiceDto.fechaFin
      ? new Date(createServiceDto.fechaFin)
      : null;
    service.tipoServicio = createServiceDto.tipoServicio;
    service.estado = createServiceDto.estado || ServiceState.PROGRAMADO; // Default to PROGRAMADO instead of PENDIENTE_RECURSOS
    service.cantidadBanos = createServiceDto.cantidadBanos;
    service.cantidadEmpleados = createServiceDto.cantidadEmpleados || 1;
    service.cantidadVehiculos = createServiceDto.cantidadVehiculos || 1;
    service.ubicacion = createServiceDto.ubicacion;
    service.notas = createServiceDto.notas || '';
    service.asignacionAutomatica =
      createServiceDto.asignacionAutomatica !== undefined
        ? createServiceDto.asignacionAutomatica
        : true;

    // Save the service to get an ID, but don't persist yet - we'll verify resources first
    const tempService = { ...service };

    // Check if resources are available before saving to database
    try {
      if (tempService.asignacionAutomatica) {
        // Check if resources are available
        await this.verifyResourcesAvailability(tempService);
      } else if (createServiceDto.asignacionesManual?.length) {
        // Manual assignments will be verified later in assignResourcesManually
      } else {
        throw new BadRequestException(
          'Se requieren asignaciones manuales cuando asignacionAutomatica es false',
        );
      }

      // Now save the service since resources are available
      const savedService = await this.serviceRepository.save(service);

      // Assign resources
      if (savedService.asignacionAutomatica) {
        await this.assignResourcesAutomatically(savedService);
      } else if (createServiceDto.asignacionesManual?.length) {
        await this.assignResourcesManually(
          savedService.id,
          createServiceDto.asignacionesManual,
        );
      }

      // Return the complete service with its assignments
      return this.findOne(savedService.id);
    } catch (error) {
      // Don't save the service if resource verification fails
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error al verificar o asignar recursos: ${errorMessage}`,
      );
      throw error;
    }
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

    // Get the original service
    const service = await this.findOne(id);

    // Create a copy to work with
    const updatedService = { ...service };

    // Ensure the date is always a valid Date object
    let fechaProgramada: Date;
    if (updateServiceDto.fechaProgramada) {
      fechaProgramada = new Date(updateServiceDto.fechaProgramada);
    } else {
      fechaProgramada = new Date(service.fechaProgramada);
    }

    // Explicitly verify the date is valid
    if (isNaN(fechaProgramada.getTime())) {
      throw new BadRequestException('La fecha programada no es válida');
    }

    // Check if the service is in a state that allows resource updates
    if (
      service.estado === ServiceState.EN_PROGRESO ||
      service.estado === ServiceState.COMPLETADO ||
      service.estado === ServiceState.CANCELADO
    ) {
      throw new BadRequestException(
        `No se pueden actualizar recursos para un servicio en estado ${service.estado}`,
      );
    }

    // Update service properties except the date
    Object.assign(updatedService, updateServiceDto);
    // Ensure the date isn't overwritten
    updatedService.fechaProgramada = fechaProgramada;

    // Determine if we need to reassign resources
    const needsResourceReassignment =
      (updateServiceDto.asignacionAutomatica !== undefined &&
        updateServiceDto.asignacionAutomatica !==
          service.asignacionAutomatica) ||
      (updateServiceDto.cantidadBanos !== undefined &&
        updateServiceDto.cantidadBanos !== service.cantidadBanos) ||
      (updateServiceDto.cantidadEmpleados !== undefined &&
        updateServiceDto.cantidadEmpleados !== service.cantidadEmpleados) ||
      (updateServiceDto.cantidadVehiculos !== undefined &&
        updateServiceDto.cantidadVehiculos !== service.cantidadVehiculos);

    // Verify resources are available if reassignment is needed
    if (needsResourceReassignment) {
      // Verify resources before making any changes
      if (updatedService.asignacionAutomatica) {
        await this.verifyResourcesAvailability(updatedService, true, service);
      } else if (!updateServiceDto.asignacionesManual?.length) {
        throw new BadRequestException(
          'Se requieren asignaciones manuales cuando asignacionAutomatica es false',
        );
      }

      // If we've reached here, resources are available or we have manual assignments

      // Save IDs of current assignments to delete them if necessary
      const assignmentIds = service.asignaciones
        ? service.asignaciones.map((a) => a.id)
        : [];

      // Release existing resources if needed
      if (
        updateServiceDto.asignacionAutomatica !== undefined &&
        updateServiceDto.asignacionAutomatica !== service.asignacionAutomatica
      ) {
        await this.releaseAssignedResources(service);

        // Delete previous assignments explicitly
        if (assignmentIds.length > 0) {
          await this.assignmentRepository.delete(assignmentIds);
          // Clean up assignments in memory too
          service.asignaciones = [];
        }
      }
    }

    // Update service properties with DTO values
    Object.assign(service, updateServiceDto);
    service.fechaProgramada = fechaProgramada;

    // Save basic changes first
    const savedService = await this.serviceRepository.save(service);

    // Perform resource reassignment if needed
    if (needsResourceReassignment) {
      if (savedService.asignacionAutomatica) {
        await this.assignResourcesAutomatically(savedService, true); // incremental mode
      } else if (updateServiceDto.asignacionesManual?.length) {
        await this.assignResourcesManually(
          savedService.id,
          updateServiceDto.asignacionesManual,
        );
      }
    }

    // Reload the complete service
    return await this.findOne(savedService.id);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Eliminando servicio con id: ${id}`);

    const service = await this.findOne(id);

    // Liberar recursos asignados
    if (service.asignaciones?.length) {
      await this.releaseAssignedResources(service);

      // Eliminar todas las asignaciones de recursos para este servicio
      await this.assignmentRepository.delete({ servicioId: id });
    }

    // Eliminar el servicio después de eliminar las asignaciones
    await this.serviceRepository.remove(service);
  }

  async changeStatus(id: number, nuevoEstado: ServiceState): Promise<Service> {
    this.logger.log(`Cambiando estado del servicio ${id} a ${nuevoEstado}`);

    const service = await this.findOne(id);

    // Validate state transitions
    this.validateStatusTransition(service.estado, nuevoEstado);

    // Update dates based on state change
    if (nuevoEstado === ServiceState.EN_PROGRESO && !service.fechaInicio) {
      service.fechaInicio = new Date();
    }

    if (nuevoEstado === ServiceState.COMPLETADO && !service.fechaFin) {
      service.fechaFin = new Date();
    }

    // If service is canceled or completed, release resources
    if (
      nuevoEstado === ServiceState.CANCELADO ||
      nuevoEstado === ServiceState.COMPLETADO
    ) {
      await this.releaseAssignedResources(service);
    }

    // Update the state
    service.estado = nuevoEstado;
    return this.serviceRepository.save(service);
  }

  private async assignResourcesAutomatically(
    service: Service,
    incremental: boolean = false,
  ): Promise<void> {
    try {
      // Si tenemos modo incremental, verificamos los recursos existentes
      let currentEmployees: Empleado[] = [];
      let currentVehicles: Vehicle[] = [];
      let currentToilets: ChemicalToilet[] = [];
      let assignments: ResourceAssignment[] = [];

      if (incremental && service.asignaciones?.length) {
        // Recolectar recursos actuales
        currentEmployees = service.asignaciones
          .filter((a) => a.empleado)
          .map((a) => a.empleado)
          .filter((emp): emp is Empleado => emp !== null);

        currentVehicles = service.asignaciones
          .filter((a) => a.vehiculo)
          .map((a) => a.vehiculo)
          .filter((veh): veh is Vehicle => veh !== null);

        currentToilets = service.asignaciones
          .filter((a) => a.bano)
          .map((a) => a.bano)
          .filter((toilet): toilet is ChemicalToilet => toilet !== null);

        // Realizar ajustes para liberar recursos o mantenerlos
        let employeesToKeep: Empleado[] = [];
        let vehiclesToKeep: Vehicle[] = [];
        let toiletsToKeep: ChemicalToilet[] = [];

        // Si necesitamos menos empleados que los que ya hay, liberar algunos
        if (currentEmployees.length > service.cantidadEmpleados) {
          // Mantener solo los primeros N empleados
          employeesToKeep = currentEmployees.slice(
            0,
            service.cantidadEmpleados,
          );

          // Liberar el resto
          const employeesToRelease = currentEmployees.slice(
            service.cantidadEmpleados,
          );
          for (const employee of employeesToRelease) {
            await this.updateResourceState(employee, ResourceState.DISPONIBLE);
          }
        } else {
          // Mantener todos los actuales
          employeesToKeep = [...currentEmployees];
        }

        // Similar para vehículos
        if (currentVehicles.length > service.cantidadVehiculos) {
          vehiclesToKeep = currentVehicles.slice(0, service.cantidadVehiculos);

          const vehiclesToRelease = currentVehicles.slice(
            service.cantidadVehiculos,
          );
          for (const vehicle of vehiclesToRelease) {
            await this.updateVehicleState(vehicle, ResourceState.DISPONIBLE);
          }
        } else {
          vehiclesToKeep = [...currentVehicles];
        }

        // Y para baños
        if (currentToilets.length > service.cantidadBanos) {
          toiletsToKeep = currentToilets.slice(0, service.cantidadBanos);

          const toiletsToRelease = currentToilets.slice(service.cantidadBanos);
          for (const toilet of toiletsToRelease) {
            await this.updateToiletState(toilet, ResourceState.DISPONIBLE);
          }
        } else {
          toiletsToKeep = [...currentToilets];
        }

        // Eliminar asignaciones, ahora que sabemos cuáles recursos se mantendrán
        const assignmentsToKeep = service.asignaciones.filter((assignment) => {
          if (
            assignment.empleado &&
            !employeesToKeep.includes(assignment.empleado)
          ) {
            return false;
          }
          if (
            assignment.vehiculo &&
            !vehiclesToKeep.includes(assignment.vehiculo)
          ) {
            return false;
          }
          if (assignment.bano && !toiletsToKeep.includes(assignment.bano)) {
            return false;
          }
          return true;
        });

        // Eliminar las asignaciones que no se mantendrán
        const assignmentsToDelete = service.asignaciones
          .filter((a) => !assignmentsToKeep.includes(a))
          .map((a) => a.id);

        if (assignmentsToDelete.length > 0) {
          await this.assignmentRepository.delete(assignmentsToDelete);
        }

        // Usar las asignaciones que se mantienen como base
        assignments = assignmentsToKeep;

        // Actualizar las variables para continuar con la asignación de recursos adicionales
        currentEmployees = employeesToKeep;
        currentVehicles = vehiclesToKeep;
        currentToilets = toiletsToKeep;
      }

      // Calcular recursos adicionales necesarios
      const additionalEmployees = Math.max(
        0,
        service.cantidadEmpleados - currentEmployees.length,
      );
      const additionalVehicles = Math.max(
        0,
        service.cantidadVehiculos - currentVehicles.length,
      );
      const additionalToilets = Math.max(
        0,
        service.cantidadBanos - currentToilets.length,
      );

      // Obtener recursos adicionales si es necesario
      let newEmployees: Empleado[] = [];
      let newVehicles: Vehicle[] = [];
      let newToilets: ChemicalToilet[] = [];

      if (additionalEmployees > 0) {
        const availableEmployees = await this.findAvailableEmployees(
          service.fechaProgramada,
        );
        if (availableEmployees.length < additionalEmployees) {
          throw new BadRequestException(
            `No hay suficientes empleados disponibles. Se necesitan ${additionalEmployees} adicionales, pero solo hay ${availableEmployees.length}`,
          );
        }
        newEmployees = availableEmployees.slice(0, additionalEmployees);
      }

      if (additionalVehicles > 0) {
        const availableVehicles = await this.findAvailableVehicles(
          service.fechaProgramada,
        );
        if (availableVehicles.length < additionalVehicles) {
          throw new BadRequestException(
            `No hay suficientes vehículos disponibles. Se necesitan ${additionalVehicles} adicionales, pero solo hay ${availableVehicles.length}`,
          );
        }
        newVehicles = availableVehicles.slice(0, additionalVehicles);
      }

      if (additionalToilets > 0) {
        newToilets = await this.findAvailableToilets(
          service.fechaProgramada,
          additionalToilets,
        );
      }

      // Cambiar estados de los nuevos recursos
      for (const employee of newEmployees) {
        await this.updateResourceState(employee, ResourceState.ASIGNADO);
        employee.estado = ResourceState.ASIGNADO.toString();
      }

      for (const vehicle of newVehicles) {
        await this.updateVehicleState(vehicle, ResourceState.ASIGNADO);
        vehicle.estado = ResourceState.ASIGNADO.toString();
      }

      // Crear nuevas asignaciones para los recursos adicionales

      // Para nuevos empleados
      for (const employee of newEmployees) {
        const empAssignment = new ResourceAssignment();
        empAssignment.servicio = service;
        empAssignment.empleado = employee;

        // Si podemos asignar también un vehículo libre, lo hacemos
        if (newVehicles.length > 0) {
          const vehicle = newVehicles.shift();
          empAssignment.vehiculo = vehicle || null;
        }

        // Si podemos asignar también un baño libre, lo hacemos
        if (newToilets.length > 0) {
          const toilet = newToilets.shift();
          if (toilet) {
            empAssignment.bano = toilet;
            await this.updateToiletState(
              empAssignment.bano,
              ResourceState.ASIGNADO,
            );
            empAssignment.bano.estado = ResourceState.ASIGNADO.toString();
          }
        }

        assignments.push(empAssignment);
      }

      // Para vehículos adicionales que quedaron sin asignar
      for (const vehicle of newVehicles) {
        const vehAssignment = new ResourceAssignment();
        vehAssignment.servicio = service;
        vehAssignment.vehiculo = vehicle;

        assignments.push(vehAssignment);
      }

      // Para baños adicionales que quedaron sin asignar
      for (const toilet of newToilets) {
        const toiletAssignment = new ResourceAssignment();
        toiletAssignment.servicio = service;
        toiletAssignment.bano = toilet;

        await this.updateToiletState(toilet, ResourceState.ASIGNADO);
        toilet.estado = ResourceState.ASIGNADO.toString();

        assignments.push(toiletAssignment);
      }

      // Guardar todas las asignaciones
      if (assignments.length > 0) {
        await this.assignmentRepository.save(assignments);
      }
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

    this.logger.log(
      `Liberando ${service.asignaciones.length} recursos para el servicio ${service.id}`,
    );

    // Recorrer todas las asignaciones y liberar cada recurso
    for (const assignment of service.asignaciones) {
      if (assignment.empleado) {
        this.logger.log(`Liberando empleado ${assignment.empleado.id}`);
        await this.employeesService.changeStatus(
          assignment.empleado.id,
          ResourceState.DISPONIBLE,
        );
      }

      if (assignment.vehiculo) {
        this.logger.log(`Liberando vehículo ${assignment.vehiculo.id}`);
        await this.vehiclesService.changeStatus(
          assignment.vehiculo.id,
          ResourceState.DISPONIBLE,
        );
      }

      if (assignment.bano) {
        this.logger.log(`Liberando baño ${assignment.bano.baño_id}`);
        await this.toiletsService.update(assignment.bano.baño_id, {
          estado: ResourceState.DISPONIBLE,
        });
      }
    }
  }

  private async findAvailableEmployees(date: Date): Promise<Empleado[]> {
    // Buscar empleados disponibles que no estén ya asignados a otro servicio en la misma fecha
    if (!date || isNaN(date.getTime())) {
      this.logger.error(
        `Fecha inválida recibida: ${date ? date.toISOString() : 'undefined'}`,
      );
      throw new BadRequestException('Se requiere una fecha válida');
    }
    const busyEmployeeIds = await this.getBusyResourceIds('empleado_id', date);

    // Obtener empleados disponibles
    const availableEmployees = await this.employeesService.findAll();

    return availableEmployees.filter(
      (employee) =>
        employee.estado === ResourceState.DISPONIBLE.toString() &&
        !busyEmployeeIds.includes(employee.id),
    );
  }

  private async findAvailableVehicles(
    date: Date,
    serviceId?: number,
  ): Promise<Vehicle[]> {
    // Obtener IDs de vehículos que ya están asignados
    if (!date || isNaN(date.getTime())) {
      this.logger.error(
        `Fecha inválida recibida: ${date ? date.toISOString() : 'undefined'}`,
      );
      throw new BadRequestException('Se requiere una fecha válida');
    }
    const busyVehicleIds = await this.getBusyResourceIds('vehiculo_id', date);

    this.logger.log(`Vehículos ocupados: ${busyVehicleIds.join(', ')}`);

    // Buscar todos los vehículos disponibles que no estén en la lista
    const availableVehicles = await this.vehiclesRepository.find({
      where: {
        estado: ResourceState.DISPONIBLE,
        id: Not(In(busyVehicleIds)),
      },
    });

    this.logger.log(
      `Vehículos con estado DISPONIBLE encontrados: ${availableVehicles.map((v) => v.id).join(', ')}`,
    );

    // Filtrar vehículos que tienen mantenimiento programado
    const result: Vehicle[] = [];
    for (const vehicle of availableVehicles) {
      // Verificar mantenimientos programados
      const hasMaintenace =
        await this.vehicleMaintenanceService.hasScheduledMaintenance(
          vehicle.id,
          date,
        );
      if (!hasMaintenace) {
        result.push(vehicle);
      } else {
        this.logger.log(
          `Vehículo ${vehicle.id} excluido por tener mantenimiento programado`,
        );
      }
    }

    this.logger.log(
      `Vehículos disponibles después de filtrar mantenimientos: ${result.map((v) => v.id).join(', ')}`,
    );

    // También incluir vehículos que estén asignados al servicio actual (si se proporciona serviceId)
    if (serviceId) {
      this.logger.log(
        `Buscando vehículos ya asignados al servicio ${serviceId}`,
      );

      // MODIFICAR ESTA CONSULTA para asegurar que devuelve resultados
      const currentServiceAssignments = await this.assignmentRepository.find({
        where: {
          servicioId: serviceId,
          vehiculoId: Not(IsNull()),
        },
        relations: ['vehiculo'],
      });

      this.logger.log(
        `Encontradas ${currentServiceAssignments.length} asignaciones con vehículos para el servicio ${serviceId}`,
      );

      // Extraer los vehículos de las asignaciones
      const assignedVehicles = currentServiceAssignments
        .map((a) => a.vehiculo)
        .filter((v): v is Vehicle => v !== null && v !== undefined);

      this.logger.log(
        `Vehículos ya asignados al servicio: ${assignedVehicles.map((v) => v.id).join(', ')}`,
      );

      // Verificar que estos vehículos no tengan mantenimientos programados
      for (const vehicle of assignedVehicles) {
        const hasMaintenace =
          await this.vehicleMaintenanceService.hasScheduledMaintenance(
            vehicle.id,
            date,
          );

        if (!hasMaintenace) {
          if (!result.some((v) => v.id === vehicle.id)) {
            this.logger.log(
              `Añadiendo vehículo ${vehicle.id} del servicio actual a la lista de disponibles`,
            );
            result.push(vehicle);
          }
        } else {
          this.logger.log(
            `Vehículo ${vehicle.id} del servicio actual excluido por tener mantenimiento programado`,
          );
        }
      }
    }

    return result;
  }

  private async findAvailableToilets(
    date: Date,
    quantity: number,
  ): Promise<ChemicalToilet[]> {
    // Obtener IDs de baños que ya están asignados
    if (!date || isNaN(date.getTime())) {
      this.logger.error(
        `Fecha inválida recibida: ${date ? date.toISOString() : 'undefined'}`,
      );
      throw new BadRequestException('Se requiere una fecha válida');
    }
    const busyToiletIds = await this.getBusyResourceIds('bano_id', date);

    // Buscar todos los baños disponibles que no estén en la lista
    const availableToilets = await this.toiletsRepository.find({
      where: {
        estado: ResourceState.DISPONIBLE,
        baño_id: Not(In(busyToiletIds)),
      },
    });

    // Filtrar baños que tienen mantenimiento programado
    const result: ChemicalToilet[] = [];
    for (const toilet of availableToilets) {
      // Verificar mantenimientos programados
      const hasMaintenace =
        await this.toiletMaintenanceService.hasScheduledMaintenance(
          toilet.baño_id,
          date,
        );
      if (!hasMaintenace) {
        result.push(toilet);
      }

      // Si ya tenemos suficientes baños, paramos la búsqueda
      if (result.length >= quantity) {
        break;
      }
    }

    if (result.length < quantity) {
      throw new BadRequestException(
        `No hay suficientes baños químicos disponibles. Se requieren ${quantity}, pero solo hay ${result.length} disponibles.`,
      );
    }

    return result.slice(0, quantity);
  }

  private async getBusyResourceIds(
    resourceField: 'empleado_id' | 'vehiculo_id' | 'bano_id',
    date: Date,
    serviceId?: number,
  ): Promise<number[]> {
    // Verificar que la fecha es válida
    if (!date || isNaN(date.getTime())) {
      this.logger.error(
        `Fecha inválida recibida en getBusyResourceIds: ${date ? date.toISOString() : 'undefined'}`,
      );
      return [];
    }

    // Obtener recursos ocupados en la fecha indicada
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.debug(
      `Buscando recursos ocupados entre ${startOfDay.toISOString()} y ${endOfDay.toISOString()}`,
    );

    // Define a type for the raw results
    type ResourceIdRecord = Record<
      'empleado_id' | 'vehiculo_id' | 'bano_id',
      number
    >;

    // El resto del método sin cambios
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
      .andWhere(`service.id != :currentServiceId`, {
        currentServiceId: serviceId || 0, // Pasar el ID del servicio actual para excluirlo
      })
      .select(`assignment.${resourceField}`)
      .getRawMany();

    // Extraer los IDs con tipo seguro
    return busyResources.map(
      (resource) => (resource as ResourceIdRecord)[resourceField],
    );
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
    // Define valid transitions
    const validTransitions: Record<ServiceState, ServiceState[]> = {
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
      [ServiceState.COMPLETADO]: [], // Final state
      [ServiceState.CANCELADO]: [], // Final state
      // Removed PENDIENTE_RECURSOS and PENDIENTE_CONFIRMACION
    };

    // Verify if the transition is valid
    if (!validTransitions[currentState]?.includes(newState)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de ${currentState} a ${newState}`,
      );
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Service[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    this.logger.log(
      `Buscando servicios entre ${start.toISOString()} y ${end.toISOString()}`,
    );

    return this.findAll({
      fechaDesde: start.toISOString(),
      fechaHasta: end.toISOString(),
    });
  }

  async findToday(): Promise<Service[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    this.logger.log(`Buscando servicios de hoy: ${today.toISOString()}`);

    return this.findAll({
      fechaDesde: today.toISOString(),
      fechaHasta: endOfDay.toISOString(),
    });
  }

  async findByStatus(estado: ServiceState): Promise<Service[]> {
    this.logger.log(`Buscando servicios con estado: ${estado}`);

    return this.findAll({ estado });
  }

  private async verifyResourcesAvailability(
    service: Service,
    incremental: boolean = false,
    existingService?: Service,
  ): Promise<void> {
    try {
      // For incremental mode, count current resources
      const currentEmployees =
        incremental && existingService?.asignaciones
          ? existingService.asignaciones
              .filter((a) => a.empleado)
              .map((a) => a.empleado)
              .filter((emp): emp is Empleado => emp !== null)
          : [];

      const currentVehicles =
        incremental && existingService?.asignaciones
          ? existingService.asignaciones
              .filter((a) => a.vehiculo)
              .map((a) => a.vehiculo)
              .filter((veh): veh is Vehicle => veh !== null)
          : [];

      const currentToilets =
        incremental && existingService?.asignaciones
          ? existingService.asignaciones
              .filter((a) => a.bano)
              .map((a) => a.bano)
              .filter((toilet): toilet is ChemicalToilet => toilet !== null)
          : [];

      // Calculate additional resources needed
      const employeesNeeded =
        service.cantidadEmpleados - currentEmployees.length;
      const vehiclesNeeded = service.cantidadVehiculos - currentVehicles.length;
      const toiletsNeeded = service.cantidadBanos - currentToilets.length;

      // Verify employee availability
      if (employeesNeeded > 0) {
        const availableEmployees = await this.findAvailableEmployees(
          service.fechaProgramada,
        );
        if (availableEmployees.length < employeesNeeded) {
          throw new BadRequestException(
            `No hay suficientes empleados disponibles. Se necesitan ${employeesNeeded} adicionales, pero solo hay ${availableEmployees.length}`,
          );
        }
      }

      // Verify vehicle availability
      if (vehiclesNeeded > 0) {
        const availableVehicles = await this.findAvailableVehicles(
          service.fechaProgramada,
          incremental && existingService ? existingService.id : undefined,
        );
        if (availableVehicles.length < vehiclesNeeded) {
          throw new BadRequestException(
            `No hay suficientes vehículos disponibles. Se necesitan ${vehiclesNeeded} adicionales, pero solo hay ${availableVehicles.length}`,
          );
        }
      }

      // Verify toilet availability
      if (toiletsNeeded > 0) {
        const availableToilets = await this.toiletsRepository.find({
          where: { estado: ResourceState.DISPONIBLE },
        });

        const busyToiletIds = await this.getBusyResourceIds(
          'bano_id',
          service.fechaProgramada,
          incremental && existingService ? existingService.id : undefined,
        );

        const reallyAvailableToilets = availableToilets.filter(
          (toilet) => !busyToiletIds.includes(toilet.baño_id),
        );

        // Filter out toilets with scheduled maintenance
        const filteredToilets: ChemicalToilet[] = [];
        for (const toilet of reallyAvailableToilets) {
          const hasMaintenance =
            await this.toiletMaintenanceService.hasScheduledMaintenance(
              toilet.baño_id,
              service.fechaProgramada,
            );

          if (!hasMaintenance) {
            filteredToilets.push(toilet);
          }
        }

        if (filteredToilets.length < toiletsNeeded) {
          throw new BadRequestException(
            `No hay suficientes baños disponibles. Se necesitan ${toiletsNeeded} adicionales, pero solo hay ${filteredToilets.length}`,
          );
        }
      }
    } catch (error) {
      // Re-throw BadRequestException, or convert other errors
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(
        `Error al verificar disponibilidad de recursos: ${errorMessage}`,
      );
    }
  }
}
