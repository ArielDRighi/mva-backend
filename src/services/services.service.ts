import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
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

    // MODIFICAR ESTA PARTE - Asegurar que la fecha siempre sea un objeto Date válido
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
      // Código existente para estados que no permiten actualización...
    }

    // Si el servicio está en un estado que permite actualización completa
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

    // Actualizar propiedades del servicio con los valores del DTO sin guardar aún
    Object.assign(updatedService, updateServiceDto);

    // IMPORTANTE: Si se requiere asignación automática y hay cambio en recursos,
    // verificar disponibilidad antes de liberar los recursos actuales
    if (needsResourceReassignment && updatedService.asignacionAutomatica) {
      try {
        // Verificar disponibilidad de empleados - PASAR fechaProgramada explícitamente
        const availableEmployees =
          await this.findAvailableEmployees(fechaProgramada);
        if (availableEmployees.length < updatedService.cantidadEmpleados) {
          throw new BadRequestException(
            `No hay suficientes empleados disponibles. Se requieren ${updatedService.cantidadEmpleados}, pero solo hay ${availableEmployees.length}`,
          );
        }

        // Verificar disponibilidad de vehículos - PASAR fechaProgramada explícitamente
        const availableVehicles =
          await this.findAvailableVehicles(fechaProgramada);
        if (availableVehicles.length < updatedService.cantidadVehiculos) {
          throw new BadRequestException(
            `No hay suficientes vehículos disponibles. Se requieren ${updatedService.cantidadVehiculos}, pero solo hay ${availableVehicles.length}`,
          );
        }

        // Verificar disponibilidad de baños
        const availableToilets = await this.toiletsRepository.find({
          where: {
            estado: ResourceState.DISPONIBLE,
          },
        });
        const busyToiletIds = await this.getBusyResourceIds(
          'bano_id',
          fechaProgramada, // <-- usar la variable validada
          service.id, // Excluir el servicio actual
        );
        const reallyAvailableToilets = availableToilets.filter(
          (toilet) => !busyToiletIds.includes(toilet.baño_id),
        );

        for (const toilet of reallyAvailableToilets) {
          const hasMaintenace =
            await this.toiletMaintenanceService.hasScheduledMaintenance(
              toilet.baño_id,
              updatedService.fechaProgramada,
            );
          if (hasMaintenace) {
            reallyAvailableToilets.splice(
              reallyAvailableToilets.indexOf(toilet),
              1,
            );
          }
        }

        if (reallyAvailableToilets.length < updatedService.cantidadBanos) {
          throw new BadRequestException(
            `No hay suficientes baños disponibles. Se requieren ${updatedService.cantidadBanos}, pero solo hay ${reallyAvailableToilets.length}`,
          );
        }
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
    if (needsResourceReassignment && service.asignaciones?.length) {
      await this.releaseAssignedResources(service);

      // Eliminar asignaciones anteriores explícitamente
      if (assignmentIds.length > 0) {
        await this.assignmentRepository.delete(assignmentIds);
        // Limpiar las asignaciones en la entidad en memoria también
        service.asignaciones = [];
      }
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
          await this.assignResourcesAutomatically(savedService);

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

    // Resto del código existente...

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

  private async assignResourcesAutomatically(service: Service): Promise<void> {
    try {
      // 1. Asignar empleados disponibles (según cantidadEmpleados)
      const availableEmployees = await this.findAvailableEmployees(
        service.fechaProgramada,
      );

      if (availableEmployees.length < service.cantidadEmpleados) {
        throw new BadRequestException(
          `No hay suficientes empleados disponibles. Se requieren ${service.cantidadEmpleados}, pero solo hay ${availableEmployees.length}`,
        );
      }

      // 2. Asignar vehículos disponibles (según cantidadVehiculos)
      const availableVehicles = await this.findAvailableVehicles(
        service.fechaProgramada,
      );

      if (availableVehicles.length < service.cantidadVehiculos) {
        throw new BadRequestException(
          `No hay suficientes vehículos disponibles. Se requieren ${service.cantidadVehiculos}, pero solo hay ${availableVehicles.length}`,
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

      // 4. Crear las asignaciones
      const assignments: ResourceAssignment[] = [];

      // Seleccionar los empleados y vehículos necesarios
      const selectedEmployees = availableEmployees.slice(
        0,
        service.cantidadEmpleados,
      );
      const selectedVehicles = availableVehicles.slice(
        0,
        service.cantidadVehiculos,
      );

      // Cambiar estados de todos los recursos seleccionados
      for (const employee of selectedEmployees) {
        await this.updateResourceState(employee, ResourceState.ASIGNADO);
        // Actualizar explícitamente el objeto en memoria también
        employee.estado = ResourceState.ASIGNADO.toString();
      }

      for (const vehicle of selectedVehicles) {
        await this.updateVehicleState(vehicle, ResourceState.ASIGNADO);
        // Actualizar explícitamente el objeto en memoria también
        vehicle.estado = ResourceState.ASIGNADO.toString();
      }

      // Crear asignación principal con el primer empleado, vehículo y baño
      const firstAssignment = new ResourceAssignment();
      firstAssignment.servicio = service;
      firstAssignment.empleado = selectedEmployees[0];
      firstAssignment.vehiculo = selectedVehicles[0];
      firstAssignment.bano = availableToilets[0];

      assignments.push(firstAssignment);
      await this.updateToiletState(availableToilets[0], ResourceState.ASIGNADO);
      availableToilets[0].estado = ResourceState.ASIGNADO.toString();

      // Crear asignaciones adicionales para empleados si hay más de uno
      for (let i = 1; i < selectedEmployees.length; i++) {
        const empAssignment = new ResourceAssignment();
        empAssignment.servicio = service;
        empAssignment.empleado = selectedEmployees[i];

        assignments.push(empAssignment);
      }

      // Crear asignaciones adicionales para vehículos si hay más de uno
      for (let i = 1; i < selectedVehicles.length; i++) {
        const vehAssignment = new ResourceAssignment();
        vehAssignment.servicio = service;
        vehAssignment.vehiculo = selectedVehicles[i];

        assignments.push(vehAssignment);
      }

      // Para el resto de baños crear asignaciones individuales
      for (let i = 1; i < service.cantidadBanos; i++) {
        const toiletAssignment = new ResourceAssignment();
        toiletAssignment.servicio = service;
        toiletAssignment.bano = availableToilets[i];

        assignments.push(toiletAssignment);
        await this.updateToiletState(
          availableToilets[i],
          ResourceState.ASIGNADO,
        );
        availableToilets[i].estado = ResourceState.ASIGNADO.toString();
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

  private async findAvailableVehicles(date: Date): Promise<Vehicle[]> {
    // Obtener IDs de vehículos que ya están asignados
    if (!date || isNaN(date.getTime())) {
      this.logger.error(
        `Fecha inválida recibida: ${date ? date.toISOString() : 'undefined'}`,
      );
      throw new BadRequestException('Se requiere una fecha válida');
    }
    const busyVehicleIds = await this.getBusyResourceIds('vehiculo_id', date);

    // Buscar todos los vehículos disponibles que no estén en la lista
    const availableVehicles = await this.vehiclesRepository.find({
      where: {
        estado: ResourceState.DISPONIBLE,
        id: Not(In(busyVehicleIds)),
      },
    });

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
