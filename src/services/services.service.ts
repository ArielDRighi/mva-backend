import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Not,
  In,
  IsNull,
  EntityManager,
  DataSource,
  MoreThanOrEqual,
  Between,
} from 'typeorm';
import { FilterServicesDto } from './dto/filter-service.dto';
import { ClientService } from '../clients/clients.service';
import { EmployeesService } from '../employees/employees.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import {
  ResourceState,
  ServiceState,
  ServiceType,
} from '../common/enums/resource-states.enum';
import { Empleado } from '../employees/entities/employee.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { VehicleMaintenanceService } from '../vehicle_maintenance/vehicle_maintenance.service';
import { ToiletMaintenanceService } from '../toilet_maintenance/toilet_maintenance.service';
import { EmployeeLeavesService } from '../employee_leaves/employee-leaves.service';
import {
  CondicionesContractuales,
  EstadoContrato,
} from '../contractual_conditions/entities/contractual_conditions.entity';
import { FutureCleaningsService } from 'src/future_cleanings/futureCleanings.service';
import {
  CreateServiceDto,
  ResourceAssignmentDto,
} from './dto/create-service.dto';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import { UpdateServiceDto } from './dto/update-service.dto';

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
    @InjectRepository(CondicionesContractuales)
    private condicionesContractualesRepository: Repository<CondicionesContractuales>,
    private readonly employeeLeavesService: EmployeeLeavesService,
    private dataSource: DataSource,
    private readonly futureCleaningsService: FutureCleaningsService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    // Crear un query runner para manejar la transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear un nuevo servicio
      let newService = new Service();

      // Asignar cliente solo si no es servicio de capacitación o si viene especificado
      if (
        createServiceDto.tipoServicio !== ServiceType.CAPACITACION ||
        createServiceDto.clienteId
      ) {
        Object.assign(newService, {
          cliente: { clienteId: createServiceDto.clienteId },
        });
      }

      // Asignar resto de propiedades
      Object.assign(newService, {
        fechaProgramada: createServiceDto.fechaProgramada,
        tipoServicio: createServiceDto.tipoServicio,
        estado: createServiceDto.estado || ServiceState.PROGRAMADO,
        cantidadBanos: createServiceDto.cantidadBanos,
        cantidadEmpleados: 2, // Siempre 2 empleados
        empleadoAId: createServiceDto.empleadoAId,
        empleadoBId: createServiceDto.empleadoBId,
        cantidadVehiculos: createServiceDto.cantidadVehiculos,
        ubicacion: createServiceDto.ubicacion,
        notas: createServiceDto.notas,
        asignacionAutomatica: createServiceDto.asignacionAutomatica,
        banosInstalados: createServiceDto.banosInstalados || [],
      });

      // Si se proporciona condicionContractualId, intentamos obtener datos de la condición contractual
      if (createServiceDto.condicionContractualId) {
        console.log('ID', createServiceDto.condicionContractualId);
        const condicionContractual =
          await this.condicionesContractualesRepository.findOne({
            where: {
              condicionContractualId: createServiceDto.condicionContractualId,
            },
            relations: ['cliente'],
          });
        console.log('condicionContractual', condicionContractual);

        if (condicionContractual) {
          newService.condicionContractualId =
            condicionContractual.condicionContractualId;

          // Asignar fechas con ajuste manual para compensar la diferencia de zona horaria
          if (
            condicionContractual.fecha_inicio &&
            condicionContractual.fecha_fin
          ) {
            // Crear nuevas fechas a partir de las originales
            const inicioOriginal = new Date(condicionContractual.fecha_inicio);
            const finOriginal = new Date(condicionContractual.fecha_fin);

            console.log('Fechas originales antes de ajustar:');
            console.log('- fecha_inicio:', inicioOriginal.toISOString());
            console.log('- fecha_fin:', finOriginal.toISOString());

            // Ajustar añadiendo un día para compensar el desplazamiento
            const inicioAjustado = new Date(inicioOriginal);
            inicioAjustado.setDate(inicioAjustado.getDate() + 1);

            const finAjustado = new Date(finOriginal);
            finAjustado.setDate(finAjustado.getDate() + 1);

            // Asignar las fechas ajustadas al servicio
            newService.fechaInicio = inicioAjustado;
            newService.fechaFin = finAjustado;
            newService.fechaFinAsignacion = finAjustado;

            console.log('Fechas después del ajuste manual:');
            console.log('- fechaInicio:', newService.fechaInicio.toISOString());
            console.log('- fechaFin:', newService.fechaFin.toISOString());
            console.log(
              '- fechaFinAsignacion:',
              newService.fechaFinAsignacion.toISOString(),
            );
          }
          console.log('Periodicidad:', condicionContractual.periodicidad);

          // Usar tipo de servicio de la condición contractual si está definido
          if (condicionContractual.tipo_servicio) {
            // Si el DTO no especifica un tipo de servicio o es igual al de la condición contractual,
            // usamos el de la condición contractual
            if (
              !createServiceDto.tipoServicio ||
              createServiceDto.tipoServicio ===
                condicionContractual.tipo_servicio
            ) {
              this.logger.log(
                `Usando tipo de servicio ${condicionContractual.tipo_servicio} de la condición contractual`,
              );
              newService.tipoServicio = condicionContractual.tipo_servicio;
            } else {
              this.logger.log(
                `Se mantiene tipo de servicio ${createServiceDto.tipoServicio} especificado en la petición`,
              );
            }
          }

          // Usar cantidad de baños si está definida en la condición contractual
          if (
            condicionContractual.cantidad_banos &&
            condicionContractual.cantidad_banos > 0
          ) {
            // Si el DTO no especifica una cantidad de baños o es igual a la de la condición contractual,
            // usamos la de la condición contractual
            if (
              !createServiceDto.cantidadBanos ||
              createServiceDto.cantidadBanos ===
                condicionContractual.cantidad_banos
            ) {
              this.logger.log(
                `Usando cantidad de baños ${condicionContractual.cantidad_banos} de la condición contractual`,
              );
              newService.cantidadBanos = condicionContractual.cantidad_banos;
            } else {
              this.logger.log(
                `Se mantiene cantidad de baños ${createServiceDto.cantidadBanos} especificada en la petición`,
              );
            }
          }
        }
      } else if (createServiceDto.clienteId && !createServiceDto.tipoServicio) {
        // Si no se especificó ID de contrato pero sí un cliente, buscar contratos activos para el cliente
        const condicionesContractuales =
          await this.condicionesContractualesRepository.find({
            where: {
              cliente: { clienteId: createServiceDto.clienteId },
              estado: EstadoContrato.ACTIVO,
            },
            order: { fecha_fin: 'DESC' },
          });

        if (condicionesContractuales && condicionesContractuales.length > 0) {
          // Usar el contrato más reciente (con fecha de finalización más lejana)
          const contratoMasReciente = condicionesContractuales[0];
          newService.condicionContractualId =
            contratoMasReciente.condicionContractualId;

          // Usar directamente las fechas sin ajustes
          if (contratoMasReciente.fecha_fin) {
            // Obtener los strings ISO
            const fechaInicioISO =
              typeof contratoMasReciente.fecha_inicio === 'string'
                ? contratoMasReciente.fecha_inicio
                : contratoMasReciente.fecha_inicio.toISOString();

            const fechaFinISO =
              typeof contratoMasReciente.fecha_fin === 'string'
                ? contratoMasReciente.fecha_fin
                : contratoMasReciente.fecha_fin.toISOString();

            // Crear nuevas fechas a partir de los strings ISO
            newService.fechaInicio = new Date(fechaInicioISO);
            newService.fechaFin = new Date(fechaFinISO);
            newService.fechaFinAsignacion = new Date(fechaFinISO);
          }

          // Usar tipo de servicio y cantidad de baños del contrato más reciente si están definidos
          if (contratoMasReciente.tipo_servicio) {
            // Si el DTO no especifica un tipo de servicio, usamos el del contrato
            if (!createServiceDto.tipoServicio) {
              this.logger.log(
                `Usando tipo de servicio ${contratoMasReciente.tipo_servicio} del contrato más reciente`,
              );
              newService.tipoServicio = contratoMasReciente.tipo_servicio;
            }
          }

          // Usar cantidad de baños si está definida en el contrato
          if (
            contratoMasReciente.cantidad_banos &&
            contratoMasReciente.cantidad_banos > 0
          ) {
            // Si el DTO no especifica una cantidad de baños, usamos la del contrato
            if (!createServiceDto.cantidadBanos) {
              this.logger.log(
                `Usando cantidad de baños ${contratoMasReciente.cantidad_banos} del contrato más reciente`,
              );
              newService.cantidadBanos = contratoMasReciente.cantidad_banos;
            }
          }
        }
      }

      // DESPUÉS de obtener los datos de la condición contractual, validamos los requisitos específicos
      this.validateServiceTypeSpecificRequirements(createServiceDto);

      // Si es un servicio de INSTALACIÓN con condición contractual, calculamos días de mantenimiento
      if (
        newService.tipoServicio === ServiceType.INSTALACION &&
        newService.condicionContractualId &&
        newService.fechaInicio &&
        newService.fechaFin
      ) {
        const condicionContractual =
          await this.condicionesContractualesRepository.findOne({
            where: {
              condicionContractualId: newService.condicionContractualId,
            },
            relations: ['cliente'],
          });

        if (condicionContractual && condicionContractual.periodicidad) {
          const periodicidad = condicionContractual.periodicidad;
          const diasMantenimiento =
            this.toiletMaintenanceService.calculateMaintenanceDays(
              newService.fechaInicio,
              newService.fechaFin,
              periodicidad,
            );
          console.log('diasMantenimiento', diasMantenimiento);

          const cliente = condicionContractual.cliente;
          console.log('cliente', cliente);
          const savedServiceForCleanings =
            await queryRunner.manager.save(newService);

          // Crear una limpieza futura por cada fecha calculada
          for (let i = 0; i < diasMantenimiento.length; i++) {
            try {
              // Crear la limpieza futura directamente usando el queryRunner
              const newCleaning = {
                cliente: { clienteId: Number(cliente.clienteId) },
                fecha_de_limpieza: diasMantenimiento[i],
                numero_de_limpieza: i + 1,
                isActive: true,
                servicio: { id: savedServiceForCleanings.id }, // Asociar al servicio recién creado
              };

              // Crear y guardar directamente con el queryRunner
              await queryRunner.manager.save('future_cleanings', newCleaning);

              this.logger.log(
                `Limpieza futura #${i + 1} creada para fecha: ${diasMantenimiento[i].toISOString()}`,
              );
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Error desconocido';
              this.logger.error(
                `Error al crear limpieza futura #${i + 1}: ${errorMessage}`,
              );
              // No lanzamos el error para que la transacción pueda continuar aunque alguna limpieza falle
            }
          }

          // Actualizar newService con la referencia correcta para continuar el proceso
          newService = savedServiceForCleanings;
        }
      }

      // IMPORTANTE: Verificar disponibilidad de recursos antes de guardar
      await this.verifyResourcesAvailability(newService);

      // Verificar si los timestamps de las fechas son correctos antes de guardar
      if (newService.fechaInicio) {
        console.log(
          'Fecha inicio antes de guardar:',
          newService.fechaInicio.toISOString(),
        );
      }
      if (newService.fechaFin) {
        console.log(
          'Fecha fin antes de guardar:',
          newService.fechaFin.toISOString(),
        );
      }
      if (newService.fechaFinAsignacion) {
        console.log(
          'Fecha fin asignacion antes de guardar:',
          newService.fechaFinAsignacion.toISOString(),
        );
      }

      // PRIMERO: Guardar el servicio para obtener un ID válido
      const savedService = await queryRunner.manager.save(newService);

      // DESPUÉS: Asignar recursos al servicio ya guardado
      if (createServiceDto.asignacionAutomatica) {
        await this.assignResourcesAutomatically(
          savedService,
          false,
          queryRunner.manager,
        );
      } else if (createServiceDto.asignacionesManual?.length) {
        await this.assignResourcesManually(
          savedService.id,
          createServiceDto.asignacionesManual,
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedService.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    filters: FilterServicesDto = {},
    page = 1,
    limit = 10,
  ): Promise<any> {
    this.logger.log('Recuperando todos los servicios');

    try {
      const queryBuilder = this.serviceRepository
        .createQueryBuilder('service')
        .leftJoinAndSelect('service.asignaciones', 'asignacion')
        .leftJoinAndSelect('service.cliente', 'cliente')
        .leftJoinAndSelect('asignacion.empleado', 'empleado')
        .leftJoinAndSelect('asignacion.vehiculo', 'vehiculo')
        .leftJoinAndSelect('asignacion.bano', 'bano');

      const { search } = filters;

      if (search) {
        const term = `%${search.toLowerCase()}%`;

        // Modificamos la consulta para buscar también por tipo de servicio
        queryBuilder
          .where('LOWER(service.estado::text) LIKE :term', { term })
          .orWhere('LOWER(service.tipo_servicio::text) LIKE :term', { term })
          .orWhere(
            'cliente.nombre_empresa IS NULL AND LOWER(service.tipo_servicio::text) LIKE :term',
            { term },
          )
          .orWhere(
            'cliente IS NOT NULL AND LOWER(cliente.nombre_empresa) LIKE :term',
            { term },
          );
      }

      queryBuilder.orderBy('service.fechaProgramada', 'ASC');

      const [services, total] = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        data: services,
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      const errorStack =
        error instanceof Error ? error.stack : 'No stack trace available';
      this.logger.error('Error al obtener los servicios', errorStack);
      throw new Error('Error al obtener los servicios');
    }
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

    // Verificar si el servicio es de tipo CAPACITACION o si se está cambiando a ese tipo
    const esServicioCapacitacion =
      service.tipoServicio === ServiceType.CAPACITACION ||
      updateServiceDto.tipoServicio === ServiceType.CAPACITACION;

    // Si es un servicio de capacitación, verificar que la asignación sea manual
    if (esServicioCapacitacion) {
      if (updateServiceDto.asignacionAutomatica) {
        throw new BadRequestException(
          `Para servicios de CAPACITACION, la asignación de empleados debe ser manual (asignacionAutomatica debe ser false)`,
        );
      }

      // Si se está cambiando a CAPACITACION, verificar cantidades
      if (updateServiceDto.tipoServicio === ServiceType.CAPACITACION) {
        if (
          (updateServiceDto.cantidadBanos !== undefined &&
            updateServiceDto.cantidadBanos !== 0) ||
          (service.cantidadBanos !== 0 &&
            updateServiceDto.cantidadBanos === undefined)
        ) {
          throw new BadRequestException(
            `Para servicios de CAPACITACION, la cantidad de baños debe ser 0`,
          );
        }

        if (
          (updateServiceDto.cantidadVehiculos !== undefined &&
            updateServiceDto.cantidadVehiculos !== 0) ||
          (service.cantidadVehiculos !== 0 &&
            updateServiceDto.cantidadVehiculos === undefined)
        ) {
          throw new BadRequestException(
            `Para servicios de CAPACITACION, la cantidad de vehículos debe ser 0`,
          );
        }
      }
    }

    // Verificar si el servicio tiene el tipoServicio correctamente cargado
    if (!service.tipoServicio) {
      this.logger.warn(
        `El servicio con ID ${id} no tiene un tipo de servicio definido.`,
      );
    }

    // Validar y asignar fecha programada
    let fechaProgramada: Date;
    if (updateServiceDto.fechaProgramada) {
      fechaProgramada = new Date(updateServiceDto.fechaProgramada);
    } else {
      fechaProgramada = new Date(service.fechaProgramada);
    }

    if (isNaN(fechaProgramada.getTime())) {
      throw new BadRequestException('La fecha programada no es válida');
    }

    // No permitir modificar servicios ya finalizados, completados o cancelados
    if (
      service.estado === ServiceState.EN_PROGRESO ||
      service.estado === ServiceState.COMPLETADO ||
      service.estado === ServiceState.CANCELADO
    ) {
      throw new BadRequestException(
        `No se pueden actualizar recursos para un servicio en estado ${service.estado}`,
      );
    }

    // Guardar el servicio actualizado
    Object.assign(service, {
      ...service,
      ...updateServiceDto,
      tipoServicio: updateServiceDto.tipoServicio ?? service.tipoServicio,
      estado: updateServiceDto.estado ?? service.estado,
      clienteId: updateServiceDto.clienteId ?? service.clienteId,
    });
    service.fechaProgramada = fechaProgramada;

    const savedService = await this.serviceRepository.save(service);

    // Log para verificar los datos del servicio actualizado
    this.logger.log(`Servicio actualizado: ${JSON.stringify(savedService)}`);

    // Reasignar recursos si es necesario
    if (updateServiceDto.asignacionAutomatica && !esServicioCapacitacion) {
      await this.assignResourcesAutomatically(savedService, true);
    } else if (updateServiceDto.asignacionesManual?.length) {
      await this.assignResourcesManually(
        savedService.id,
        updateServiceDto.asignacionesManual,
      );
    }
    return this.findOne(savedService.id);
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Eliminando servicio con id: ${id}`);

    const service = await this.findOne(id);

    // Liberar recursos asignados
    if (service.asignaciones?.length) {
      await this.releaseAssignedResources(service);

      // Eliminar todas las asignaciones de recursos para este servicio
      await this.assignmentRepository.delete({ servicioId: id });
    } // Eliminar el servicio después de eliminar las asignaciones
    await this.serviceRepository.delete(id);
  }

  async changeStatus(
    id: number,
    nuevoEstado: ServiceState,
    comentarioIncompleto?: string,
  ): Promise<Service> {
    this.logger.log(`Cambiando estado del servicio ${id} a ${nuevoEstado}`);

    const service = await this.findOne(id);

    // Validar transición de estado
    this.validateStatusTransition(service.estado, nuevoEstado);

    // Validar que se proporcione comentario obligatorio para estado INCOMPLETO
    if (nuevoEstado === ServiceState.INCOMPLETO && !comentarioIncompleto) {
      throw new BadRequestException(
        'Para cambiar un servicio a estado INCOMPLETO, debe proporcionar un comentario explicando el motivo',
      );
    }

    // Actualizar fechas
    if (nuevoEstado === ServiceState.EN_PROGRESO && !service.fechaInicio) {
      service.fechaInicio = new Date();
    }

    if (nuevoEstado === ServiceState.COMPLETADO && !service.fechaFin) {
      service.fechaFin = new Date();

      // Si es un servicio de RETIRO, cambiar el estado de los baños retirados
      if (
        service.tipoServicio === ServiceType.RETIRO &&
        service.banosInstalados?.length > 0
      ) {
        for (const banoId of service.banosInstalados) {
          await this.toiletsService.update(banoId, {
            estado: ResourceState.EN_MANTENIMIENTO,
          });
        }
      }
    }

    // Si se marca como INCOMPLETO, también guardar la fecha de fin y el comentario
    if (nuevoEstado === ServiceState.INCOMPLETO) {
      service.fechaFin = new Date();
      service.comentarioIncompleto = comentarioIncompleto || '';
    }

    // Liberar recursos cuando corresponda
    if (
      nuevoEstado === ServiceState.CANCELADO ||
      nuevoEstado === ServiceState.COMPLETADO ||
      nuevoEstado === ServiceState.INCOMPLETO
    ) {
      // Para servicios de INSTALACIÓN, retención basada en contrato
      if (service.tipoServicio === ServiceType.INSTALACION) {
        // No liberar los baños, ya que están en alquiler hasta fechaFinAsignacion
        await this.releaseNonToiletResources(service);
      }
      // Para servicios de RETIRO, ya se procesaron los baños arriba
      else if (service.tipoServicio === ServiceType.RETIRO) {
        await this.releaseNonToiletResources(service);
      }
      // Para servicios de LIMPIEZA y MANTENIMIENTO_IN_SITU, no liberar baños
      else if (
        service.tipoServicio === ServiceType.LIMPIEZA ||
        service.tipoServicio === ServiceType.MANTENIMIENTO_IN_SITU
      ) {
        await this.releaseNonToiletResources(service);
      }
      // Para otros servicios, liberar todos los recursos
      else {
        await this.releaseAssignedResources(service);
      }
    }

    // Guardar estado actualizado
    service.estado = nuevoEstado;
    const savedService = await this.serviceRepository.save(service);

    return savedService;
  }

  // Nuevo método para liberar solo recursos excepto baños
  private async releaseNonToiletResources(service: Service): Promise<void> {
    // Cargar las asignaciones si no se han cargado ya
    if (!service.asignaciones) {
      service.asignaciones = await this.assignmentRepository.find({
        where: { servicioId: service.id },
        relations: ['empleado', 'vehiculo'],
      });
    }

    this.logger.log(
      `Liberando recursos no-baños para el servicio ${service.id}`,
    );

    // Verificar asignación múltiple para empleados y vehículos
    const otherActiveServices = await this.serviceRepository.find({
      where: {
        id: Not(service.id),
        estado: In([ServiceState.PROGRAMADO, ServiceState.EN_PROGRESO]),
      },
      relations: [
        'asignaciones',
        'asignaciones.empleado',
        'asignaciones.vehiculo',
      ],
    });

    // Recorrer todas las asignaciones y liberar cada recurso
    for (const assignment of service.asignaciones) {
      if (assignment.empleado) {
        // Verificar si el empleado está asignado a otros servicios activos
        const isEmployeeInOtherServices = otherActiveServices.some((s) =>
          s.asignaciones.some((a) => a.empleadoId === assignment.empleadoId),
        );

        if (!isEmployeeInOtherServices) {
          this.logger.log(`Liberando empleado ${assignment.empleado.id}`);
          await this.employeesService.changeStatus(
            assignment.empleado.id,
            ResourceState.DISPONIBLE,
          );
        }
      }

      if (assignment.vehiculo) {
        // Verificar si el vehículo está asignado a otros servicios activos
        const isVehicleInOtherServices = otherActiveServices.some((s) =>
          s.asignaciones.some((a) => a.vehiculoId === assignment.vehiculoId),
        );

        if (!isVehicleInOtherServices) {
          this.logger.log(`Liberando vehículo ${assignment.vehiculo.id}`);
          await this.vehiclesService.changeStatus(
            assignment.vehiculo.id,
            ResourceState.DISPONIBLE,
          );
        }
      }
    }
  }

  private async assignResourcesAutomatically(
    service: Service,
    incremental: boolean = false,
    entityManager?: EntityManager,
  ): Promise<void> {
    try {
      // Definir qué tipos de servicio requieren baños nuevos del inventario
      const requiereNuevosBanos = [
        ServiceType.INSTALACION,
        ServiceType.TRASLADO,
        ServiceType.REUBICACION,
      ].includes(service.tipoServicio);

      // Comprobar si es un servicio de capacitación usando una variable auxiliar
      const esServicioCapacitacion =
        service.tipoServicio === ServiceType.CAPACITACION;

      // Si tenemos modo incremental, verificamos los recursos existentes
      let empleadoA: Empleado | null = null;
      let empleadoB: Empleado | null = null;
      let currentVehicles: Vehicle[] = [];
      let currentToilets: ChemicalToilet[] = [];
      const assignments: ResourceAssignment[] = [];

      if (incremental && service.asignaciones?.length) {
        // Recolectar recursos actuales
        const currentEmployees = service.asignaciones
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

        // Identificar empleadoA y empleadoB si ya están asignados
        // Primero verificamos si ya están almacenados en la entidad de service
        if (service.empleadoAId) {
          empleadoA =
            currentEmployees.find((e) => e.id === service.empleadoAId) || null;
        }

        if (service.empleadoBId) {
          empleadoB =
            currentEmployees.find((e) => e.id === service.empleadoBId) || null;
        }

        // Si no estaban en la entidad, tomamos los dos primeros empleados asignados
        if (!empleadoA && currentEmployees.length > 0) {
          empleadoA = currentEmployees[0];
        }

        if (!empleadoB && currentEmployees.length > 1) {
          empleadoB = currentEmployees[1];
        }

        // Realizar ajustes para liberar recursos o mantenerlos
        let vehiclesToKeep: Vehicle[] = [];
        let toiletsToKeep: ChemicalToilet[] = [];

        // Mantener vehículos necesarios
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

        // Mantener baños necesarios
        if (currentToilets.length > service.cantidadBanos) {
          toiletsToKeep = currentToilets.slice(0, service.cantidadBanos);

          const toiletsToRelease = currentToilets.slice(service.cantidadBanos);
          for (const toilet of toiletsToRelease) {
            await this.updateToiletState(toilet, ResourceState.DISPONIBLE);
          }
        } else {
          toiletsToKeep = [...currentToilets];
        }

        // Eliminar todas las asignaciones actuales ya que las vamos a recrear
        if (service.asignaciones.length > 0) {
          const assignmentsIds = service.asignaciones.map((a) => a.id);
          await this.assignmentRepository.delete(assignmentsIds);
        }

        // Actualizar las variables para continuar
        currentVehicles = vehiclesToKeep;
        currentToilets = toiletsToKeep;
      }

      // Ahora obtenemos los empleados que necesitamos (siempre 2)
      const empleadosRequeridos: string[] = [];

      // Determinar qué empleados necesitamos obtener
      if (!empleadoA) {
        empleadosRequeridos.push('A');
      }

      if (!empleadoB) {
        empleadosRequeridos.push('B');
      }

      // Calcular recursos adicionales necesarios
      const numEmpleadosNecesarios = empleadosRequeridos.length;
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

      if (numEmpleadosNecesarios > 0) {
        // Buscar empleados disponibles
        const employeesResponse = await this.employeesService.findAll({
          page: 1,
          limit: 10,
        });

        // Acceder a la propiedad 'data' que contiene el array de empleados
        const allEmployees = employeesResponse.data || [];

        const availableEmployees = allEmployees.filter(
          (employee) =>
            employee.estado === ResourceState.DISPONIBLE.toString() ||
            employee.estado === ResourceState.ASIGNADO.toString(),
        );

        if (availableEmployees.length < numEmpleadosNecesarios) {
          throw new BadRequestException(
            `No hay suficientes empleados disponibles o asignados. Se necesitan ${numEmpleadosNecesarios} adicionales, pero solo hay ${availableEmployees.length}`,
          );
        }
        newEmployees = availableEmployees.slice(0, numEmpleadosNecesarios);

        // Asignar a empleadoA y empleadoB según sea necesario
        for (const tipo of empleadosRequeridos) {
          const nuevoEmpleado = newEmployees.shift();
          if (tipo === 'A' && nuevoEmpleado) {
            empleadoA = nuevoEmpleado;
            service.empleadoAId = nuevoEmpleado.id;
          } else if (tipo === 'B' && nuevoEmpleado) {
            empleadoB = nuevoEmpleado;
            service.empleadoBId = nuevoEmpleado.id;
          }
        }

        // Guardar el servicio con los IDs de empleado actualizados
        if (entityManager) {
          await entityManager.save(service);
        } else {
          await this.serviceRepository.save(service);
        }
      }

      if (additionalVehicles > 0) {
        // Modificado para incluir vehículos ASIGNADOS
        const allVehicles = await this.vehiclesRepository.find();
        const availableVehicles = allVehicles.filter(
          (vehicle) =>
            vehicle.estado === ResourceState.DISPONIBLE.toString() ||
            vehicle.estado === ResourceState.ASIGNADO.toString(),
        );

        // Filtrar vehículos con mantenimiento programado
        const eligibleVehicles: Vehicle[] = [];
        for (const vehicle of availableVehicles) {
          const hasMaintenace =
            await this.vehicleMaintenanceService.hasScheduledMaintenance(
              vehicle.id,
              service.fechaProgramada,
            );
          if (!hasMaintenace) {
            eligibleVehicles.push(vehicle);
          }
        }

        if (eligibleVehicles.length < additionalVehicles) {
          throw new BadRequestException(
            `No hay suficientes vehículos disponibles o asignados. Se necesitan ${additionalVehicles} adicionales, pero solo hay ${eligibleVehicles.length}`,
          );
        }
        newVehicles = eligibleVehicles.slice(0, additionalVehicles);
      }

      // Solo buscar nuevos baños si el servicio lo requiere
      if (requiereNuevosBanos && additionalToilets > 0) {
        newToilets = await this.findAvailableToilets(
          service.fechaProgramada,
          additionalToilets,
        );
      }

      // Cambiar estados de los nuevos recursos
      for (const employee of newEmployees) {
        // Solo actualizar si estaba DISPONIBLE
        if (employee.estado === ResourceState.DISPONIBLE.toString()) {
          // Para servicios de capacitación, cambiar a EN_CAPACITACION, para otros a ASIGNADO
          const newState = esServicioCapacitacion
            ? ResourceState.EN_CAPACITACION
            : ResourceState.ASIGNADO;
          await this.updateResourceState(employee, newState);
          employee.estado = newState.toString();
        }
      }

      for (const vehicle of newVehicles) {
        if (vehicle.estado === ResourceState.DISPONIBLE.toString()) {
          await this.updateVehicleState(vehicle, ResourceState.ASIGNADO);
          vehicle.estado = ResourceState.ASIGNADO.toString();
        }
      }

      // Modificación: simplificar las asignaciones, sin vincular los recursos específicamente a los empleados

      // 1. Crear asignaciones para los empleados (siempre 2)
      if (empleadoA) {
        const assignmentA = new ResourceAssignment();
        assignmentA.servicio = service;
        assignmentA.empleado = empleadoA;
        assignments.push(assignmentA);
      }

      if (empleadoB) {
        const assignmentB = new ResourceAssignment();
        assignmentB.servicio = service;
        assignmentB.empleado = empleadoB;
        assignments.push(assignmentB);
      }

      // 2. Crear asignaciones para todos los vehículos
      const allVehicles = [...currentVehicles, ...newVehicles];
      for (const vehicle of allVehicles) {
        const vehicleAssignment = new ResourceAssignment();
        vehicleAssignment.servicio = service;
        vehicleAssignment.vehiculo = vehicle;
        assignments.push(vehicleAssignment);
      }

      // 3. Crear asignaciones para todos los baños
      const allToilets = [...currentToilets, ...newToilets];
      for (const toilet of allToilets) {
        if (toilet.estado !== ResourceState.ASIGNADO.toString()) {
          await this.updateToiletState(toilet, ResourceState.ASIGNADO);
          toilet.estado = ResourceState.ASIGNADO;
        }

        const toiletAssignment = new ResourceAssignment();
        toiletAssignment.servicio = service;
        toiletAssignment.bano = toilet;
        assignments.push(toiletAssignment);
      }

      // Guardar todas las asignaciones
      if (assignments.length > 0) {
        if (entityManager) {
          await entityManager.save(assignments);
        } else {
          await this.assignmentRepository.save(assignments);
        }
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
    entityManager?: EntityManager,
  ): Promise<void> {
    // Usamos un try-catch para manejar errores de manera más explícita
    try {
      // Obtenemos el servicio usando el entity manager si está disponible
      let service: Service;

      if (entityManager) {
        // Dentro de una transacción, usamos el entity manager para buscar el servicio
        const foundService = await entityManager.findOne(Service, {
          where: { id: serviceId },
          relations: ['cliente'],
        });

        if (!foundService) {
          throw new NotFoundException(
            `Servicio con id ${serviceId} no encontrado durante la transacción`,
          );
        }

        service = foundService;
      } else {
        // Fuera de una transacción, usamos el método findOne normal
        service = await this.findOne(serviceId);
      }

      // Verificar que el servicio existe
      const assignments: ResourceAssignment[] = [];

      // Comprobar si es un servicio de capacitación - usando la variable auxiliar
      const esServicioCapacitacion =
        service.tipoServicio === ServiceType.CAPACITACION;

      // Procesar cada asignación manual
      for (const assignmentDto of assignmentDtos) {
        // Verificar empleado
        let employee: Empleado | null = null;
        if (assignmentDto.empleadoId) {
          // Obtenemos el empleado usando el entity manager si está disponible
          if (entityManager) {
            const foundEmployee = await entityManager.findOne(Empleado, {
              where: { id: assignmentDto.empleadoId },
            });

            if (!foundEmployee) {
              throw new NotFoundException(
                `Empleado con id ${assignmentDto.empleadoId} no encontrado`,
              );
            }

            employee = foundEmployee;
          } else {
            employee = await this.employeesService.findOne(
              assignmentDto.empleadoId,
            );
          }

          // Modificado: permitir tanto DISPONIBLE como ASIGNADO
          if (
            employee.estado !== ResourceState.DISPONIBLE.toString() &&
            employee.estado !== ResourceState.ASIGNADO.toString()
          ) {
            throw new BadRequestException(
              `El empleado con ID ${employee.id} no está disponible ni asignado`,
            );
          }

          // Verificar si el empleado tiene licencia/vacaciones para la fecha del servicio
          const isAvailable =
            await this.employeeLeavesService.isEmployeeAvailable(
              employee.id,
              new Date(service.fechaProgramada),
            );

          if (!isAvailable) {
            throw new BadRequestException(
              `El empleado con ID ${employee.id} tiene licencia o vacaciones programadas para la fecha del servicio`,
            );
          }

          // Solo actualizar el estado si estaba DISPONIBLE
          if (employee.estado === ResourceState.DISPONIBLE.toString()) {
            // Para servicios de capacitación, cambiar a EN_CAPACITACION, para otros a ASIGNADO
            const newState = esServicioCapacitacion
              ? ResourceState.EN_CAPACITACION
              : ResourceState.ASIGNADO;

            if (entityManager) {
              employee.estado = newState.toString();
              await entityManager.save(employee);
            } else {
              await this.updateResourceState(employee, newState);
            }
          }
        }

        // Verificar vehículo
        let vehicle: Vehicle | null = null;
        if (assignmentDto.vehiculoId) {
          // Obtenemos el vehículo usando el entity manager si está disponible
          if (entityManager) {
            const foundVehicle = await entityManager.findOne(Vehicle, {
              where: { id: assignmentDto.vehiculoId },
            });

            if (!foundVehicle) {
              throw new NotFoundException(
                `Vehículo con id ${assignmentDto.vehiculoId} no encontrado`,
              );
            }

            vehicle = foundVehicle;
          } else {
            vehicle = await this.vehiclesService.findOne(
              assignmentDto.vehiculoId,
            );
          }

          // Modificado: permitir tanto DISPONIBLE como ASIGNADO
          if (
            vehicle.estado !== ResourceState.DISPONIBLE.toString() &&
            vehicle.estado !== ResourceState.ASIGNADO.toString()
          ) {
            throw new BadRequestException(
              `El vehículo con ID ${vehicle.id} no está disponible ni asignado`,
            );
          }

          // Solo actualizar el estado si estaba DISPONIBLE
          if (vehicle.estado === ResourceState.DISPONIBLE.toString()) {
            if (entityManager) {
              vehicle.estado = ResourceState.ASIGNADO.toString();
              await entityManager.save(vehicle);
            } else {
              await this.updateVehicleState(vehicle, ResourceState.ASIGNADO);
            }
          }
        }

        // Verificar baños - No cambiamos esta parte porque los baños
        // todavía necesitan estar DISPONIBLE para ser asignados
        if (assignmentDto.banosIds && assignmentDto.banosIds.length > 0) {
          for (const toiletId of assignmentDto.banosIds) {
            let toilet: ChemicalToilet;

            // Obtenemos el baño usando el entity manager si está disponible
            if (entityManager) {
              const foundToilet = await entityManager.findOne(ChemicalToilet, {
                where: { baño_id: toiletId },
              });

              if (!foundToilet) {
                throw new NotFoundException(
                  `Baño con id ${toiletId} no encontrado`,
                );
              }

              toilet = foundToilet;
            } else {
              toilet = await this.toiletsService.findById(toiletId);
            }

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

            if (entityManager) {
              toilet.estado = ResourceState.ASIGNADO;
              await entityManager.save(toilet);
            } else {
              await this.updateToiletState(toilet, ResourceState.ASIGNADO);
            }
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
      if (assignments.length > 0) {
        if (entityManager) {
          await entityManager.save(assignments);
        } else {
          await this.assignmentRepository.save(assignments);
        }
      }
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
        // Liberar independientemente del estado (puede ser ASIGNADO o EN_CAPACITACION)
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
    // Buscar empleados disponibles o ya asignados
    if (!date || isNaN(date.getTime())) {
      this.logger.error(
        `Fecha inválida recibida: ${date ? date.toISOString() : 'undefined'}`,
      );
      throw new BadRequestException('Se requiere una fecha válida');
    }

    // Obtener todos los empleados (ya no filtramos por estado ocupado)
    const availableEmployees = await this.employeesService.findAll({
      page: 1,
      limit: 10,
    });

    // Incluir tanto DISPONIBLE como ASIGNADO
    return availableEmployees.filter(
      (employee) =>
        employee.estado === ResourceState.DISPONIBLE.toString() ||
        employee.estado === ResourceState.ASIGNADO.toString(),
    );
  }

  private async findAvailableVehicles(
    date: Date,
    serviceId?: number,
  ): Promise<Vehicle[]> {
    if (!date || isNaN(date.getTime())) {
      this.logger.error(
        `Fecha inválida recibida: ${date ? date.toISOString() : 'undefined'}`,
      );
      throw new BadRequestException('Se requiere una fecha válida');
    }

    // Buscar todos los vehículos DISPONIBLES o ASIGNADOS
    const availableVehicles = await this.vehiclesRepository.find({
      where: [
        { estado: ResourceState.DISPONIBLE },
        { estado: ResourceState.ASIGNADO },
      ],
    });

    this.logger.log(
      `Vehículos con estado DISPONIBLE o ASIGNADO encontrados: ${availableVehicles.map((v) => v.id).join(', ')}`,
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
        ServiceState.INCOMPLETO, // Se puede marcar como INCOMPLETO desde EN_PROGRESO
      ],
      [ServiceState.SUSPENDIDO]: [
        ServiceState.EN_PROGRESO,
        ServiceState.CANCELADO,
      ],
      [ServiceState.COMPLETADO]: [], // Final state
      [ServiceState.CANCELADO]: [], // Final state
      [ServiceState.INCOMPLETO]: [], // Final state
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
  async getRemainingWeekServices(): Promise<Service[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual

    // Calcular el próximo domingo (fin de la semana actual)
    const sunday = new Date(today);
    const currentDay = today.getDay(); // 0 = domingo, 6 = sábado
    const daysUntilSunday = (7 - currentDay) % 7;
    sunday.setDate(sunday.getDate() + daysUntilSunday);
    sunday.setHours(23, 59, 59, 999); // Fin del domingo

    return this.findByDateRange(today.toISOString(), sunday.toISOString());
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
    // If incremental, we need to consider existing resources
    if (incremental && existingService) {
      this.logger.log(
        'Verificando disponibilidad de recursos en modo incremental',
      );
    } else {
      this.logger.log(
        'Verificando disponibilidad de recursos en modo completo',
      );
    }

    try {
      // Si el servicio tiene una condición contractual asociada pero no tiene tipo de servicio,
      // intentamos obtener el tipo de servicio de la condición contractual
      if (service.condicionContractualId && !service.tipoServicio) {
        const condicionContractual =
          await this.condicionesContractualesRepository.findOne({
            where: { condicionContractualId: service.condicionContractualId },
          });

        if (condicionContractual && condicionContractual.tipo_servicio) {
          this.logger.log(
            `Obteniendo tipo de servicio desde condición contractual: ${condicionContractual.tipo_servicio}`,
          );
          service.tipoServicio = condicionContractual.tipo_servicio;

          // Si también falta la cantidad de baños, la obtenemos de la condición contractual
          if (
            service.cantidadBanos === undefined &&
            condicionContractual.cantidad_banos
          ) {
            this.logger.log(
              `Obteniendo cantidad de baños desde condición contractual: ${condicionContractual.cantidad_banos}`,
            );
            service.cantidadBanos = condicionContractual.cantidad_banos;
          }
        }
      }

      // Validar que se haya especificado un tipo de servicio
      if (!service.tipoServicio) {
        throw new BadRequestException('El tipo de servicio es obligatorio');
      }

      // Definir qué tipos de servicio requieren baños nuevos del inventario
      const requiereNuevosBanos = [
        ServiceType.INSTALACION,
        ServiceType.TRASLADO,
        ServiceType.REUBICACION,
      ].includes(service.tipoServicio);

      // Definir qué tipos de servicio operan sobre baños ya instalados en el cliente
      const requiereBanosInstalados = [
        ServiceType.LIMPIEZA,
        ServiceType.REEMPLAZO,
        ServiceType.RETIRO,
        ServiceType.MANTENIMIENTO_IN_SITU,
        ServiceType.REPARACION,
      ].includes(service.tipoServicio);

      // Cálculo de recursos necesarios - Para empleados siempre son 2
      const employeesNeeded = 2; // Siempre necesitamos 2 empleados
      const vehiclesNeeded = service.cantidadVehiculos;
      const toiletsNeeded = requiereNuevosBanos ? service.cantidadBanos : 0;

      // Para servicios que requieren baños nuevos, verificar la cantidad
      if (requiereNuevosBanos && service.cantidadBanos <= 0) {
        throw new BadRequestException(
          `Para servicios de tipo ${service.tipoServicio}, debe especificar una cantidad de baños mayor a 0`,
        );
      }

      // Para servicios que operan sobre baños ya instalados
      if (requiereBanosInstalados) {
        // Verificar que se hayan especificado los baños ya instalados
        if (!service.banosInstalados || service.banosInstalados.length === 0) {
          throw new BadRequestException(
            `Para servicios de ${service.tipoServicio}, debe especificar los IDs de los baños instalados en el campo 'banosInstalados'`,
          );
        }

        // Verificar que la cantidad de baños sea 0 (no se requieren nuevos)
        if (service.cantidadBanos > 0) {
          throw new BadRequestException(
            `Para servicios de ${service.tipoServicio}, la cantidad de baños debe ser 0 ya que se operará sobre baños ya instalados`,
          );
        }

        // Verificar que los baños especificados existan y estén en estado ASIGNADO
        for (const banoId of service.banosInstalados) {
          const bano = await this.toiletsRepository.findOne({
            where: { baño_id: banoId },
          });

          if (!bano) {
            throw new BadRequestException(`El baño con ID ${banoId} no existe`);
          }

          if (bano.estado !== ResourceState.ASIGNADO.toString()) {
            throw new BadRequestException(
              `El baño con ID ${banoId} no está en estado ASIGNADO. Estado actual: ${bano.estado}`,
            );
          }
        }
      }

      // Verificar disponibilidad de empleados
      if (employeesNeeded > 0) {
        // Primero, obtenemos todos los empleados disponibles actualmente
        const employeesResponse: { data: Empleado[] } =
          await this.employeesService.findAll({
            page: 1,
            limit: 10,
          });

        // Accedemos a la propiedad 'data' que contiene el array de empleados
        const allEmployees = employeesResponse.data || [];

        const availableEmployees = allEmployees.filter(
          (employee) =>
            employee.estado === ResourceState.DISPONIBLE.toString() ||
            employee.estado === ResourceState.ASIGNADO.toString(),
        );

        // Luego, filtramos los que estarán disponibles en la fecha del servicio
        const employeesAvailableOnDate: Empleado[] = [];

        for (const employee of availableEmployees) {
          // Verificar si el empleado estará en licencia/vacaciones para la fecha del servicio
          const isAvailable =
            await this.employeeLeavesService.isEmployeeAvailable(
              employee.id,
              new Date(service.fechaProgramada),
            );

          if (isAvailable) {
            employeesAvailableOnDate.push(employee);
          } else {
            this.logger.log(
              `Empleado ${employee.id} excluido por tener licencia/vacaciones programada para la fecha del servicio`,
            );
          }
        }

        if (employeesAvailableOnDate.length < employeesNeeded) {
          throw new BadRequestException(
            `No hay suficientes empleados disponibles para la fecha. Se necesitan ${employeesNeeded}, pero solo hay ${employeesAvailableOnDate.length} disponibles.`,
          );
        }

        // Continuar con la asignación usando employeesAvailableOnDate
      }

      // Verificar disponibilidad de vehículos (igual que antes)
      if (vehiclesNeeded > 0) {
        // Resto del código para verificar vehículos
      }

      // Verificar disponibilidad de baños solo si se requieren nuevos baños
      if (toiletsNeeded > 0) {
        const availableToilets = await this.toiletsRepository.find({
          where: { estado: ResourceState.DISPONIBLE },
        });

        // Verificar si hay suficientes baños disponibles
        if (availableToilets.length < toiletsNeeded) {
          throw new BadRequestException(
            `No hay suficientes baños disponibles. Se necesitan ${toiletsNeeded}, pero solo hay ${availableToilets.length} disponibles.`,
          );
        }
        // Resto del código para verificar baños
      }
    } catch (error) {
      // Manejo de errores
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

  private validateServiceTypeSpecificRequirements(
    service: CreateServiceDto,
  ): void {
    // Si se proporciona un condicionContractualId, no validamos estos requisitos
    // ya que se completarán con la información de la condición contractual
    if (service.condicionContractualId && !service.tipoServicio) {
      return;
    }

    const serviciosConBanosInstalados = [
      ServiceType.LIMPIEZA,
      ServiceType.RETIRO,
      ServiceType.REEMPLAZO,
      ServiceType.MANTENIMIENTO_IN_SITU,
      ServiceType.REPARACION,
    ];

    const serviciosConBanosNuevos = [
      ServiceType.INSTALACION,
      ServiceType.TRASLADO,
      ServiceType.REUBICACION,
      ServiceType.MANTENIMIENTO,
    ];

    const serviciosSoloEmpleados = [ServiceType.CAPACITACION];

    // Si no se proporciona un tipo de servicio, no podemos validar los requisitos específicos
    if (!service.tipoServicio) {
      return;
    }

    // Validar el servicio de CAPACITACIÓN (sólo requiere empleados)
    if (serviciosSoloEmpleados.includes(service.tipoServicio)) {
      if (service.cantidadBanos !== 0) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, la cantidad de baños debe ser 0 ya que no se utilizan baños`,
        );
      }

      if (service.cantidadVehiculos !== 0) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, la cantidad de vehículos debe ser 0 ya que no se utilizan vehículos`,
        );
      }

      if (service.banosInstalados && service.banosInstalados.length > 0) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, no se debe especificar el campo 'banosInstalados'`,
        );
      }

      // Para CAPACITACION, asignación debe ser manual
      if (service.asignacionAutomatica) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, la asignación de empleados debe ser manual (asignacionAutomatica debe ser false)`,
        );
      }

      // Para CAPACITACION, se deben especificar las asignaciones manuales
      if (
        !service.asignacionesManual ||
        service.asignacionesManual.length === 0
      ) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, debe especificar los empleados a asignar en el campo 'asignacionesManual'`,
        );
      }
    }

    // Validar servicios que requieren baños instalados
    if (serviciosConBanosInstalados.includes(service.tipoServicio)) {
      if (service.cantidadBanos !== 0) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, la cantidad de baños debe ser 0 ya que se operará sobre baños ya instalados`,
        );
      }

      if (!service.banosInstalados || service.banosInstalados.length === 0) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, debe especificar los IDs de los baños ya instalados en el campo 'banosInstalados'`,
        );
      }
    }

    // Validar servicios que requieren baños nuevos
    if (serviciosConBanosNuevos.includes(service.tipoServicio)) {
      // Si cantidadBanos es undefined, es posible que se complete desde la condición contractual
      if (service.cantidadBanos !== undefined && service.cantidadBanos <= 0) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, la cantidad de baños debe ser mayor a 0`,
        );
      }

      if (service.banosInstalados && service.banosInstalados.length > 0) {
        throw new BadRequestException(
          `Para servicios de ${service.tipoServicio}, no se debe especificar el campo 'banosInstalados'`,
        );
      }
    }
  }

  async getProximosServicios(): Promise<Service[]> {
    this.logger.log('Obteniendo los próximos 5 servicios');

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Inicio del día actual

    try {
      const servicios = await this.serviceRepository.find({
        where: {
          fechaProgramada: MoreThanOrEqual(today),
          estado: ServiceState.PROGRAMADO,
        },
        relations: [
          'cliente',
          'asignaciones',
          'asignaciones.empleado',
          'asignaciones.vehiculo',
          'asignaciones.bano',
        ],
        order: {
          fechaProgramada: 'ASC',
        },
        take: 5,
      });

      this.logger.log(`Encontrados ${servicios.length} próximos servicios`);
      return servicios;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error al obtener próximos servicios: ${errorMessage}`);
      throw new BadRequestException(
        `Error al obtener próximos servicios: ${errorMessage}`,
      );
    }
  }

  async getStats(): Promise<{
    totalInstalacion: number;
    totalLimpieza: number;
    totalRetiro: number;
    total: number;
  }> {
    const total = await this.serviceRepository.count();
    const totalInstalacion = await this.serviceRepository.count({
      where: { tipoServicio: ServiceType.INSTALACION },
    });
    const totalLimpieza = await this.serviceRepository.count({
      where: { tipoServicio: ServiceType.LIMPIEZA },
    });
    const totalRetiro = await this.serviceRepository.count({
      where: { tipoServicio: ServiceType.RETIRO },
    });

    return {
      totalInstalacion,
      totalLimpieza,
      totalRetiro,
      total,
    };
  }

  async getResumenServicios() {
    this.logger.log('Obteniendo resumen de servicios');

    try {
      // Obtener fecha actual y configurar inicio del día
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Calcular el domingo (fin de la semana actual)
      const endOfWeek = new Date(today);
      const currentDay = today.getDay(); // 0 = domingo, 6 = sábado
      const daysUntilSunday = (7 - currentDay) % 7;
      endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
      endOfWeek.setHours(23, 59, 59, 999);

      // Calcular inicio de la semana anterior (7 días atrás desde hoy)
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

      // 1. Servicios pendientes para esta semana (PROGRAMADOS)
      const serviciosPendientes = await this.serviceRepository.find({
        where: {
          fechaProgramada: Between(today, endOfWeek),
          estado: ServiceState.PROGRAMADO,
        },
        relations: [
          'cliente',
          'asignaciones',
          'asignaciones.empleado',
          'asignaciones.vehiculo',
          'asignaciones.bano',
        ],
        order: {
          fechaProgramada: 'ASC',
        },
      });

      // 2. Servicios completados en la última semana
      const serviciosCompletados = await this.serviceRepository.find({
        where: {
          fechaFin: Between(startOfLastWeek, today),
          estado: ServiceState.COMPLETADO,
        },
        relations: [
          'cliente',
          'asignaciones',
          'asignaciones.empleado',
          'asignaciones.vehiculo',
          'asignaciones.bano',
        ],
        order: {
          fechaFin: 'DESC',
        },
      });

      return {
        pendientes: serviciosPendientes.length,
        completados: serviciosCompletados.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error al obtener resumen de servicios: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Error al obtener resumen de servicios: ${errorMessage}`,
      );
    }
  }
}
