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
    service.estado = createServiceDto.estado || ServiceState.PENDIENTE_RECURSOS;
    service.cantidadBanos = createServiceDto.cantidadBanos;
    service.cantidadEmpleados = createServiceDto.cantidadEmpleados || 1;
    service.cantidadVehiculos = createServiceDto.cantidadVehiculos || 1;
    service.ubicacion = createServiceDto.ubicacion;
    service.notas = createServiceDto.notas || '';
    service.asignacionAutomatica =
      createServiceDto.asignacionAutomatica !== undefined
        ? createServiceDto.asignacionAutomatica
        : true;

    // Guardar el servicio para obtener el ID
    const savedService = await this.serviceRepository.save(service);

    // Asignar recursos (automáticos o manuales)
    if (savedService.asignacionAutomatica) {
      await this.assignResourcesAutomatically(savedService);
    } else if (createServiceDto.asignacionesManual?.length) {
      await this.assignResourcesManually(
        savedService.id,
        createServiceDto.asignacionesManual,
      );
    }

    // Actualizar estado del servicio
    const updatedService = await this.findOne(savedService.id);
    if (updatedService.asignaciones?.length > 0) {
      updatedService.estado = ServiceState.PROGRAMADO;
      await this.serviceRepository.save(updatedService);
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

    // Después de obtener el servicio original
    const service = await this.findOne(id);

    // Crear una copia para trabajar con ella
    const updatedService = { ...service };

    // Asegurar que la fecha siempre sea un objeto Date válido
    let fechaProgramada: Date;
    if (updateServiceDto.fechaProgramada) {
      fechaProgramada = new Date(updateServiceDto.fechaProgramada);
    } else {
      fechaProgramada = new Date(service.fechaProgramada);
    }

    // Verificar explícitamente que la fecha es válida
    if (isNaN(fechaProgramada.getTime())) {
      throw new BadRequestException('La fecha programada no es válida');
    }

    // Aplicar cambios al servicio, manteniendo la fecha
    updatedService.fechaProgramada = fechaProgramada;
    Object.assign(updatedService, updateServiceDto);
    // Asegurar que la fecha no se sobreescriba
    updatedService.fechaProgramada = fechaProgramada;

    // Verificar si el servicio está en un estado que permite actualización de recursos
    if (
      service.estado === ServiceState.EN_PROGRESO ||
      service.estado === ServiceState.COMPLETADO ||
      service.estado === ServiceState.CANCELADO
    ) {
      throw new BadRequestException(
        `No se pueden actualizar recursos para un servicio en estado ${service.estado}`,
      );
    }

    // Determinar si necesitamos reasignar recursos
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

    // Si se requiere asignación automática y hay cambio en recursos,
    // verificar disponibilidad INCREMENTAL antes de liberar los recursos actuales
    if (needsResourceReassignment && updatedService.asignacionAutomatica) {
      try {
        // Contar recursos ACTUALES del servicio para cada tipo
        const currentEmployees =
          service.asignaciones
            ?.filter((a) => a.empleado)
            .map((a) => a.empleado) || [];

        const currentVehicles =
          service.asignaciones
            ?.filter((a) => a.vehiculo)
            .map((a) => a.vehiculo) || [];

        const currentToilets =
          service.asignaciones?.filter((a) => a.bano).map((a) => a.bano) || [];

        // Verificar disponibilidad de empleados ADICIONALES si son necesarios
        const employeesNeeded =
          updatedService.cantidadEmpleados - currentEmployees.length;
        if (employeesNeeded > 0) {
          const availableEmployees =
            await this.findAvailableEmployees(fechaProgramada);
          if (availableEmployees.length < employeesNeeded) {
            throw new BadRequestException(
              `No hay suficientes empleados disponibles. Se necesitan ${employeesNeeded} adicionales, pero solo hay ${availableEmployees.length}`,
            );
          }
          this.logger.log(
            `Verificados ${availableEmployees.length} empleados disponibles, se necesitan ${employeesNeeded} adicionales`,
          );
        }

        // Verificar disponibilidad de vehículos ADICIONALES si son necesarios
        const vehiclesNeeded =
          updatedService.cantidadVehiculos - currentVehicles.length;
        if (vehiclesNeeded > 0) {
          this.logger.log(
            `Servicio ${service.id} tiene ${currentVehicles.length} vehículos actuales, necesita ${vehiclesNeeded} más`,
          );

          const availableVehicles = await this.findAvailableVehicles(
            fechaProgramada,
            service.id,
          );

          this.logger.log(
            `Vehículos disponibles encontrados: ${availableVehicles.length}. IDs: ${availableVehicles.map((v) => v.id).join(', ')}`,
          );

          if (availableVehicles.length < vehiclesNeeded) {
            throw new BadRequestException(
              `No hay suficientes vehículos disponibles. Se necesitan ${vehiclesNeeded} adicionales, pero solo hay ${availableVehicles.length}`,
            );
          }
          // ...
        }

        // Verificar disponibilidad de baños ADICIONALES si son necesarios
        const toiletsNeeded =
          updatedService.cantidadBanos - currentToilets.length;
        if (toiletsNeeded > 0) {
          // Obtener baños disponibles que no estén asignados en la fecha
          const availableToilets = await this.toiletsRepository.find({
            where: { estado: ResourceState.DISPONIBLE },
          });

          const busyToiletIds = await this.getBusyResourceIds(
            'bano_id',
            fechaProgramada,
            service.id,
          );

          const reallyAvailableToilets = availableToilets.filter(
            (toilet) => !busyToiletIds.includes(toilet.baño_id),
          );

          // Filtrar por mantenimientos programados
          const filteredToilets: ChemicalToilet[] = [];
          for (const toilet of reallyAvailableToilets) {
            const hasMaintenance =
              await this.toiletMaintenanceService.hasScheduledMaintenance(
                toilet.baño_id,
                fechaProgramada,
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
          this.logger.log(
            `Verificados ${filteredToilets.length} baños disponibles, se necesitan ${toiletsNeeded} adicionales`,
          );
        }

        // Si necesitamos reducir la cantidad de recursos, aún podemos hacerlo sin verificar disponibilidad
      } catch (error) {
        // Si hay error en la verificación, rechazar la actualización
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

    // Si llegamos aquí, hay suficientes recursos disponibles o no necesitamos reasignar

    // Guardar IDs de asignaciones actuales para eliminarlas después si es necesario
    const assignmentIds = service.asignaciones
      ? service.asignaciones.map((a) => a.id)
      : [];

    // Liberar recursos existentes si es necesario
    if (needsResourceReassignment) {
      // Si cambiamos el modo de asignación, liberamos todos los recursos
      if (
        updateServiceDto.asignacionAutomatica !== undefined &&
        updateServiceDto.asignacionAutomatica !== service.asignacionAutomatica
      ) {
        await this.releaseAssignedResources(service);

        // Eliminar asignaciones anteriores explícitamente
        if (assignmentIds.length > 0) {
          await this.assignmentRepository.delete(assignmentIds);
          // Limpiar las asignaciones en la entidad en memoria también
          service.asignaciones = [];
        }
      }
      // Si sólo cambiamos cantidades, manejarlo en assignResourcesAutomatically
    }

    // Actualizar propiedades del servicio con los valores del DTO
    Object.assign(service, updateServiceDto);

    // Guardar cambios básicos primero
    const savedService = await this.serviceRepository.save(service);

    // Realizar la reasignación de recursos si es necesario
    if (
      needsResourceReassignment ||
      service.estado === ServiceState.PENDIENTE_RECURSOS
    ) {
      if (savedService.asignacionAutomatica) {
        try {
          // Actualizar la fecha antes de asignar recursos automáticamente
          savedService.fechaProgramada = fechaProgramada;
          await this.assignResourcesAutomatically(savedService, true); // true = modo incremental

          // Si la asignación fue exitosa, cambiar el estado a PROGRAMADO
          if (savedService.estado === ServiceState.PENDIENTE_RECURSOS) {
            savedService.estado = ServiceState.PROGRAMADO;
            await this.serviceRepository.save(savedService);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Error desconocido';
          this.logger.error(`Error al reasignar recursos: ${errorMessage}`);
          savedService.estado = ServiceState.PENDIENTE_RECURSOS;
          await this.serviceRepository.save(savedService);
        }
      } else if (updateServiceDto.asignacionesManual?.length) {
        await this.assignResourcesManually(
          savedService.id,
          updateServiceDto.asignacionesManual,
        );

        // Si había estado pendiente, cambiarlo a PROGRAMADO
        if (savedService.estado === ServiceState.PENDIENTE_RECURSOS) {
          savedService.estado = ServiceState.PROGRAMADO;
          await this.serviceRepository.save(savedService);
        }
      }
    }

    // Recargar el servicio completo
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
