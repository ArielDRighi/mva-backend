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
import { CondicionesContractuales } from '../contractual_conditions/entities/contractual_conditions.entity';
import { FutureCleaningsService } from 'src/future_cleanings/futureCleanings.service';
import {
  CreateServiceDto,
  ResourceAssignmentDto,
} from './dto/create-service.dto';
import { Service } from './entities/service.entity';
import { ResourceAssignment } from './entities/resource-assignment.entity';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Cliente } from 'src/clients/entities/client.entity';
import { MailerService } from 'src/mailer/mailer.service';

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
    @InjectRepository(Empleado)
    private empleadosRepository: Repository<Empleado>,
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
    @InjectRepository(Cliente)
    private clientesRepository: Repository<Cliente>,
    private readonly mailerService: MailerService,
  ) {}

  // services.service.ts
  async create(dto: CreateServiceDto): Promise<Service> {
    switch (dto.tipoServicio) {
      case ServiceType.INSTALACION:
        return this.createInstalacion(dto);
      case ServiceType.CAPACITACION:
        return this.createCapacitacion(dto);
      case ServiceType.LIMPIEZA:
        return this.createLimpieza(dto);
      default:
        return this.createGenerico(dto);
    }
  }
  private async createInstalacion(dto: CreateServiceDto): Promise<Service> {
    const service = await this.createBaseService(dto);

    // Lógica específica: calcular recordatorios de limpiezas futuras
    if (
      service.condicionContractualId &&
      service.fechaInicio &&
      service.fechaFin
    ) {
      const condicion = await this.condicionesContractualesRepository.findOne({
        where: { condicionContractualId: service.condicionContractualId },
        relations: ['cliente'],
      });

      if (condicion?.periodicidad) {
        const dias = this.toiletMaintenanceService.calculateMaintenanceDays(
          service.fechaInicio,
          service.fechaFin,
          condicion.periodicidad,
        );

        for (let i = 0; i < dias.length; i++) {
          try {
            const createFutureCleaningDto = {
              clientId: condicion.cliente.clienteId,
              fecha_de_limpieza: dias[i],
              servicioId: service.id,
            };

            // Usar el servicio de Future Cleanings para crear los recordatorios
            await this.futureCleaningsService.createFutureCleaning(
              createFutureCleaningDto,
            );
            this.logger.log(
              `Recordatorio de limpieza #${i + 1} programado para: ${dias[i].toISOString()}`,
            );
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Error desconocido';
            this.logger.error(
              `Error al crear recordatorio de limpieza #${i + 1}: ${errorMessage}`,
            );
          }
        }
      }
    }

    return this.findOne(service.id);
  }

  private async createCapacitacion(dto: CreateServiceDto): Promise<Service> {
    dto.cantidadVehiculos = 0;
    const service = await this.createBaseService(dto);

    await this.scheduleEmployeeStatusForCapacitacion(service);

    return this.findOne(service.id);
  }
  private async createLimpieza(dto: CreateServiceDto): Promise<Service> {
    const service = await this.createBaseService(dto);

    // Si no se especificaron baños, tomar los del último servicio de instalación del cliente
    if (
      (!dto.banosInstalados || dto.banosInstalados.length === 0) &&
      dto.clienteId
    ) {
      const ultimoServicioInstalacion = await this.serviceRepository.findOne({
        where: {
          cliente: { clienteId: dto.clienteId },
          tipoServicio: ServiceType.INSTALACION,
        },
        order: { fechaProgramada: 'DESC' },
      });

      if (ultimoServicioInstalacion?.banosInstalados?.length) {
        service.banosInstalados = ultimoServicioInstalacion.banosInstalados;
        
        // Guardar los baños asignados en la base de datos
        await this.serviceRepository.save(service);
        this.logger.log(
          `Baños asignados automáticamente al servicio de limpieza ${service.id}: ${service.banosInstalados.join(', ')}`,
        );
      } else {
        this.logger.warn(
          `No se encontraron baños instalados para cliente ${dto.clienteId}`,
        );
        service.banosInstalados = [];
      }
    }

    return this.findOne(service.id);
  }

  private async createGenerico(dto: CreateServiceDto): Promise<Service> {
    return this.createBaseService(dto);
  }

  private async createBaseService(dto: CreateServiceDto): Promise<Service> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(
        `[Service] Creando servicio con DTO: ${JSON.stringify(dto)}`,
      );
      const newService = new Service();
      let cliente: Cliente | null = null;

      if (dto.clienteId) {
        this.logger.log(`[Service] Buscando cliente con ID: ${dto.clienteId}`);
        cliente = await this.clientesRepository.findOne({
          where: { clienteId: dto.clienteId },
        });
        if (!cliente)
          throw new Error(`Cliente ID ${dto.clienteId} no encontrado`);
      }

      if (dto.condicionContractualId) {
        this.logger.log(
          `[Service] Buscando contrato con ID: ${dto.condicionContractualId}`,
        );
        const contrato = await this.condicionesContractualesRepository.findOne({
          where: { condicionContractualId: dto.condicionContractualId },
          relations: ['cliente'],
        });

        if (contrato) {
          newService.condicionContractualId = contrato.condicionContractualId;
          if (!cliente) cliente = contrato.cliente;

          if (contrato.fecha_inicio && contrato.fecha_fin) {
            // Validar que las fechas del contrato sean válidas
            const contratoFechaInicio = new Date(contrato.fecha_inicio);
            const contratoFechaFin = new Date(contrato.fecha_fin);

            if (contratoFechaInicio >= contratoFechaFin) {
              throw new BadRequestException(
                'El contrato asociado tiene fechas inválidas: la fecha de inicio debe ser anterior a la fecha de fin',
              );
            }

            const fechaInicio = new Date(contrato.fecha_inicio);
            const fechaFin = new Date(contrato.fecha_fin);
            fechaInicio.setDate(fechaInicio.getDate() + 1);
            fechaFin.setDate(fechaFin.getDate() + 1);
            newService.fechaInicio = fechaInicio;
            newService.fechaFin = fechaFin;
            newService.fechaFinAsignacion = fechaFin;
          }

          if (!dto.tipoServicio && contrato.tipo_servicio) {
            newService.tipoServicio = contrato.tipo_servicio;
          }

          if (!dto.cantidadBanos && contrato.cantidad_banos) {
            newService.cantidadBanos = contrato.cantidad_banos;
          }
        }
      }

      if (!cliente && dto.tipoServicio !== ServiceType.CAPACITACION) {
        throw new Error('No se pudo determinar el cliente');
      }

      if (cliente) {
        newService.cliente = cliente;
      }

      if (
        dto.tipoServicio &&
        [ServiceType.CAPACITACION, ServiceType.LIMPIEZA].includes(
          dto.tipoServicio,
        )
      ) {
        dto.cantidadBanos = 0;
      }

      const banosInstaladosFromManual =
        dto.banosInstalados ||
        (dto.asignacionesManual?.length
          ? dto.asignacionesManual.flatMap((a) => a.banosIds || [])
          : []);
      Object.assign(newService, {
        fechaProgramada: dto.fechaProgramada,
        tipoServicio: newService.tipoServicio || dto.tipoServicio,
        estado: dto.estado || ServiceState.PROGRAMADO,
        cantidadBanos: newService.cantidadBanos || dto.cantidadBanos,
        cantidadEmpleados: this.getDefaultCantidadEmpleados(
          newService.tipoServicio || dto.tipoServicio,
        ),
        cantidadVehiculos: dto.cantidadVehiculos,
        ubicacion: dto.ubicacion,
        notas: dto.notas,
        banosInstalados: banosInstaladosFromManual,
        asignacionAutomatica: false,
      });
      this.validateServiceTypeSpecificRequirements(dto);
      // Handle forzar property without unsafe any casting
      if (dto.forzar !== undefined) {
        Object.assign(newService, { forzar: dto.forzar });
      }

      await this.verifyResourcesAvailability(newService);

      const saved = await queryRunner.manager.save(newService);

      if (dto.asignacionesManual?.length) {
        const empleadosAsignados = dto.asignacionesManual.map(
          (a) => a.empleadoId,
        );
        const empleadosUnicos = new Set(empleadosAsignados);

        if (empleadosAsignados.length !== empleadosUnicos.size) {
          throw new Error(
            'No se puede asignar el mismo empleado más de una vez al mismo servicio.',
          );
        }

        await this.assignResourcesManually(
          saved.id,
          dto.asignacionesManual,
          queryRunner.manager,
        );
      }

      await queryRunner.commitTransaction();

      // **MAIL ENVIADO POR EL INTERCEPTOR, NO ACÁ**

      return saved;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido';
      this.logger.error(`[Service] Error al crear servicio: ${errorMessage}`);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private getDefaultCantidadEmpleados(tipoServicio?: ServiceType): number {
    switch (tipoServicio) {
      case ServiceType.CAPACITACION:
        return 1; // o 0 si no necesitás ninguno
      case ServiceType.INSTALACION:
      case ServiceType.LIMPIEZA:
        return 1;
      default:
        return 1;
    }
  }
  private async scheduleEmployeeStatusForCapacitacion(service: Service) {
    if (!service.fechaInicio || !service.fechaFin) return;

    const asignaciones = await this.assignmentRepository.find({
      where: { servicioId: service.id },
      relations: ['empleado'],
    });

    const empleados: number[] = asignaciones
      .map((a) => a.empleadoId)
      .filter((id): id is number => typeof id === 'number');

    for (const empleadoId of empleados) {
      await this.dataSource.manager.query(
        `INSERT INTO scheduled_employee_statuses (id, nuevo_estado, fecha_cambio, servicio_id) VALUES ($1, $2, $3, $4)`,
        [empleadoId, 'EN_CAPACITACION', service.fechaInicio, service.id],
      );

      await this.dataSource.manager.query(
        `INSERT INTO scheduled_employee_statuses (id, nuevo_estado, fecha_cambio, servicio_id) VALUES ($1, $2, $3, $4)`,
        [empleadoId, 'DISPONIBLE', service.fechaFin, service.id],
      );
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
    this.logger.log(
      `Asignando recursos manualmente al servicio ${service.id}: ${JSON.stringify(service.asignaciones)}`,
    );

    const esCapacitacionActual =
      service.tipoServicio === ServiceType.CAPACITACION;
    const esCapacitacionNuevo =
      updateServiceDto.tipoServicio === ServiceType.CAPACITACION;

    const esServicioCapacitacion = esCapacitacionActual || esCapacitacionNuevo;

    if (esServicioCapacitacion) {
      if (updateServiceDto.asignacionAutomatica) {
        throw new BadRequestException(
          `Para servicios de CAPACITACION, la asignación de empleados debe ser manual`,
        );
      }

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

    if (!service.tipoServicio) {
      this.logger.warn(
        `El servicio con ID ${id} no tiene un tipo de servicio definido.`,
      );
    }

    let fechaProgramada: Date;
    if (updateServiceDto.fechaProgramada) {
      fechaProgramada = new Date(updateServiceDto.fechaProgramada);
    } else {
      fechaProgramada = new Date(service.fechaProgramada);
    }

    if (isNaN(fechaProgramada.getTime())) {
      throw new BadRequestException('La fecha programada no es válida');
    }

    if (
      service.estado === ServiceState.EN_PROGRESO ||
      service.estado === ServiceState.COMPLETADO ||
      service.estado === ServiceState.CANCELADO
    ) {
      throw new BadRequestException(
        `No se pueden actualizar recursos para un servicio en estado ${service.estado}`,
      );
    }

    Object.assign(service, {
      ...service,
      ...updateServiceDto,
      tipoServicio: updateServiceDto.tipoServicio ?? service.tipoServicio,
      estado: updateServiceDto.estado ?? service.estado,
      clienteId: updateServiceDto.clienteId ?? service.clienteId,
      fechaProgramada,
    });

    const savedService = await this.serviceRepository.save(service);

    this.logger.log(`Servicio actualizado: ${JSON.stringify(savedService)}`);

    // Reasignación de recursos
    let empleadosAsignados: number[] = [];

    if (updateServiceDto.asignacionesManual?.length) {
      await this.assignResourcesManually(
        savedService.id,
        updateServiceDto.asignacionesManual,
        this.dataSource.manager,
      );

      empleadosAsignados = updateServiceDto.asignacionesManual
        .map((a) => a.empleadoId)
        .filter((id): id is number => id !== undefined);
    }

    // Estado de empleados: si el servicio ya está en progreso, actualizar su estado a EN_X
    if (savedService.estado === ServiceState.EN_PROGRESO) {
      const nuevoEstado = this.mapServiceTypeToEmpleadoState(
        savedService.tipoServicio,
      );
      for (const empleadoId of empleadosAsignados) {
        await this.dataSource.manager.update(
          'employees',
          { id: empleadoId },
          { estado: nuevoEstado },
        );
      }
    }
    if (empleadosAsignados.length > 0) {
      this.logger.log(
        `Empleados asignados manualmente: ${empleadosAsignados.join(', ')}`,
      );

      const empleados = await this.empleadosRepository.findBy({
        id: In(empleadosAsignados),
      });

      this.logger.log(
        `Empleados encontrados: ${empleados.map((e) => `${e.id}-${e.nombre}`).join(', ')}`,
      );

      const cliente = await this.clientesRepository.findOne({
        where: { clienteId: savedService.cliente?.clienteId },
      });

      if (!cliente) {
        this.logger.warn(
          `Cliente no encontrado para clienteId: ${savedService.cliente?.clienteId}`,
        );
      }

      const toiletEntities = await this.toiletsRepository.findBy({
        baño_id: In(savedService.banosInstalados ?? []),
      });

      this.logger.log(
        `Baños encontrados: ${toiletEntities.map((b) => b.codigo_interno || `Baño #${b.baño_id}`).join(', ')}`,
      );

      const toilets = toiletEntities.map(
        (b) => b.codigo_interno || `Baño #${b.baño_id}`,
      );

      const clientes = cliente?.nombre
        ? [cliente.nombre]
        : ['Cliente desconocido'];
      const direccion = cliente?.direccion || 'Dirección no especificada';
      const fechaInicio = savedService.fechaInicio?.toISOString().split('T')[0];
      const fechaProgramada = savedService.fechaProgramada
        ?.toISOString()
        .split('T')[0];

      for (const empleado of empleados) {
        if (!empleado.email) {
          this.logger.warn(
            `Empleado ${empleado.nombre} (ID ${empleado.id}) no tiene email, no se envía notificación.`,
          );
          continue;
        }

        try {
          this.logger.log(
            `Enviando correo a ${empleado.email} (${empleado.nombre})`,
          );
          await this.mailerService.sendRouteModified(
            empleado.email,
            empleado.nombre,
            'Vehículo asignado', // Acá podrías reemplazar por la placa o nombre real
            toilets,
            clientes,
            savedService.tipoServicio,
            fechaProgramada,
            direccion,
            fechaInicio,
          );
          this.logger.log(`Correo enviado exitosamente a ${empleado.email}`);
        } catch (error) {
          this.logger.error(
            `Error al enviar correo a ${empleado.email}:`,
            error,
          );
        }
      }
    }
    return this.findOne(savedService.id);
  }

  // Utilidad para mapear tipo de servicio a estado de empleado
  private mapServiceTypeToEmpleadoState(tipoServicio: ServiceType): string {
    switch (tipoServicio) {
      case ServiceType.CAPACITACION:
        return 'EN_CAPACITACION';
      case ServiceType.LIMPIEZA:
        return 'EN_LIMPIEZA';
      case ServiceType.INSTALACION:
        return 'EN_INSTALACION';
      default:
        return 'OCUPADO';
    }
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

    // Validar comentario obligatorio para estado INCOMPLETO
    if (nuevoEstado === ServiceState.INCOMPLETO && !comentarioIncompleto) {
      throw new BadRequestException(
        'Para cambiar un servicio a estado INCOMPLETO, debe proporcionar un comentario explicando el motivo',
      );
    } // Al iniciar servicio
    if (nuevoEstado === ServiceState.EN_PROGRESO) {
      if (!service.fechaInicio) {
        service.fechaInicio = new Date();
      }

      // Los recursos ya están en estado ASIGNADO desde la creación del servicio
      // Ya no es necesario cambiar su estado aquí
      this.logger.log(
        'Servicio iniciado - Los recursos ya están en estado ASIGNADO',
      );
    }

    // Al completar servicio
    if (nuevoEstado === ServiceState.COMPLETADO) {
      if (!service.fechaFin) {
        service.fechaFin = new Date();
      }

      // Si es servicio RETIRO, cambiar estado baños a EN_MANTENIMIENTO
      if (
        service.tipoServicio === ServiceType.RETIRO &&
        service.banosInstalados?.length > 0
      ) {
        for (const banoId of service.banosInstalados) {
          await this.toiletsService.update(banoId, {
            estado: ResourceState.MANTENIMIENTO,
          });
        }
      }

      // ---------> Desactivar limpieza futura si es limpieza
      this.logger.log(`Tipo de servicio: ${service.tipoServicio}`);
      if (service.tipoServicio === ServiceType.LIMPIEZA) {
        this.logger.log(
          `Buscando limpieza futura activa para servicio ${service.id}`,
        );
        await this.dataSource.query(
          `
        WITH limpieza_a_desactivar AS (
          SELECT limpieza_id
          FROM future_cleanings
          WHERE "servicioId" = $1 AND "isActive" = true
          ORDER BY limpieza_fecha ASC
          LIMIT 1
        )
        UPDATE future_cleanings
        SET "isActive" = false
        WHERE limpieza_id IN (SELECT limpieza_id FROM limpieza_a_desactivar);
      `,
          [service.id],
        );
        this.logger.log(
          `Limpieza futura relacionada al servicio ${service.id} desactivada.`,
        );
      }
    }

    if (nuevoEstado === ServiceState.INCOMPLETO) {
      service.fechaFin = new Date();
      service.comentarioIncompleto = comentarioIncompleto || '';
    }

    // Liberar recursos si corresponde
    if (
      nuevoEstado === ServiceState.CANCELADO ||
      nuevoEstado === ServiceState.COMPLETADO ||
      nuevoEstado === ServiceState.INCOMPLETO
    ) {
      if (
        service.tipoServicio === ServiceType.INSTALACION ||
        service.tipoServicio === ServiceType.RETIRO ||
        service.tipoServicio === ServiceType.LIMPIEZA ||
        service.tipoServicio === ServiceType.MANTENIMIENTO_IN_SITU
      ) {
        await this.releaseNonToiletResources(service);
      } else {
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

  async assignResourcesManually(
    serviceId: number,
    dtos: ResourceAssignmentDto[],
    manager: EntityManager,
  ): Promise<ResourceAssignment[]> {
    const assignments: ResourceAssignment[] = [];

    const empleadosProcesados = new Set<number>();
    const vehiculosProcesados = new Set<number>();
    const banosProcesados = new Set<number>();

    console.log('--- Inicio assignResourcesManually ---');
    console.log('serviceId:', serviceId);
    console.log('Cantidad de dtos:', dtos.length);

    for (const [index, dto] of dtos.entries()) {
      console.log(`Procesando dto índice ${index}:`, dto);

      // Empleados
      if (dto.empleadoId && !empleadosProcesados.has(dto.empleadoId)) {
        const empleado = await this.empleadosRepository.findOne({
          where: { id: dto.empleadoId },
        });
        if (!empleado) {
          throw new NotFoundException(
            `Empleado con ID ${dto.empleadoId} no encontrado`,
          );
        }

        const assignment = new ResourceAssignment();
        assignment.servicioId = serviceId;
        assignment.empleado = empleado;
        assignment.empleadoId = empleado.id;
        assignment.rolEmpleado = dto.rol ?? null;

        assignments.push(assignment);
        empleadosProcesados.add(empleado.id);
        console.log('Asignación creada para empleado:', assignment);
      }

      // Vehículos
      if (dto.vehiculoId && !vehiculosProcesados.has(dto.vehiculoId)) {
        const vehiculo = await this.vehiclesRepository.findOne({
          where: { id: dto.vehiculoId },
        });
        if (!vehiculo) {
          throw new NotFoundException(
            `Vehículo con ID ${dto.vehiculoId} no encontrado`,
          );
        }

        const assignment = new ResourceAssignment();
        assignment.servicioId = serviceId;
        assignment.vehiculo = vehiculo;
        assignment.vehiculoId = vehiculo.id;

        assignments.push(assignment);
        vehiculosProcesados.add(vehiculo.id);
        console.log('Asignación creada para vehículo:', assignment);
      } // Baños
      if (dto.banosIds?.length) {
        const banos = await this.toiletsRepository.find({
          where: { baño_id: In(dto.banosIds) },
        });

        const encontrados = banos.map((b) => b.baño_id);
        const noEncontrados = dto.banosIds.filter(
          (id) => !encontrados.includes(id),
        );

        if (noEncontrados.length > 0) {
          throw new NotFoundException(
            `Baños no encontrados con IDs: ${noEncontrados.join(', ')}`,
          );
        } // Validar estado de baños y generar advertencias
        for (const bano of banos) {
          if (!banosProcesados.has(bano.baño_id)) {
            // Si el baño está ASIGNADO, no permitir la asignación
            if (bano.estado === ResourceState.ASIGNADO) {
              throw new BadRequestException(
                `El baño ${bano.baño_id} (${bano.codigo_interno}) está en estado ASIGNADO y no puede ser asignado a otro servicio`,
              );
            }

            // Verificar si el baño ya está asignado a otros servicios PROGRAMADOS
            const existingAssignment = await manager
              .createQueryBuilder()
              .select([
                'asig.servicio_id as "servicioId"',
                'servicio.fecha_programada as "fechaProgramada"',
              ])
              .from('asignacion_recursos', 'asig')
              .innerJoin(
                'servicios',
                'servicio',
                'servicio.id = asig.servicio_id',
              )
              .where('asig.bano_id = :banoId', { banoId: bano.baño_id })
              .andWhere('servicio.estado = :estado', {
                estado: ServiceState.PROGRAMADO,
              })
              .andWhere('asig.servicio_id != :currentServiceId', {
                currentServiceId: serviceId,
              })
              .getRawOne();

            if (existingAssignment) {
              const fechaServicio = new Date(
                existingAssignment.fechaProgramada,
              );
              console.log(
                `⚠️ ADVERTENCIA: Baño ${bano.baño_id} (${bano.codigo_interno}) ya está seleccionado para el servicio ${existingAssignment.servicioId} programado para ${fechaServicio.toLocaleDateString()}`,
              );
            }

            const assignment = new ResourceAssignment();
            assignment.servicioId = serviceId;
            assignment.banoId = bano.baño_id;

            assignments.push(assignment);
            banosProcesados.add(bano.baño_id);
            console.log('Asignación creada para baño:', assignment);
          }
        }
      }
    }
    console.log('Total de asignaciones a guardar:', assignments.length);
    const saved = await manager.save(assignments);
    console.log('Asignaciones guardadas:', saved.length);

    // Actualizar estados de recursos a ASIGNADO inmediatamente al crear las asignaciones
    console.log(
      'Actualizando estados de recursos a ASIGNADO tras crear las asignaciones',
    ); // Actualizar estados de empleados únicos
    const empleadosIds = Array.from(empleadosProcesados);
    if (empleadosIds.length > 0) {
      await manager.update(
        'employees',
        { id: In(empleadosIds) },
        { estado: ResourceState.ASIGNADO },
      );
      console.log(
        `Estados actualizados para empleados: ${empleadosIds.join(', ')}`,
      );
    }

    // Actualizar estados de vehículos únicos
    const vehiculosIds = Array.from(vehiculosProcesados);
    if (vehiculosIds.length > 0) {
      await manager.update(
        'vehicles',
        { id: In(vehiculosIds) },
        { estado: ResourceState.ASIGNADO },
      );
      console.log(
        `Estados actualizados para vehículos: ${vehiculosIds.join(', ')}`,
      );
    }

    // Actualizar estados de baños únicos
    const banosIds = Array.from(banosProcesados);
    if (banosIds.length > 0) {
      await manager.update(
        'chemical_toilets',
        { baño_id: In(banosIds) },
        { estado: ResourceState.ASIGNADO },
      );
      console.log(`Estados actualizados para baños: ${banosIds.join(', ')}`);
    }

    console.log('--- Fin assignResourcesManually ---');

    return saved;
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
    this.logger.log(
      incremental && existingService
        ? 'Verificando disponibilidad de recursos en modo incremental'
        : 'Verificando disponibilidad de recursos en modo completo',
    );

    try {
      // Inicializar alertas
      const alertas: string[] = [];

      // Obtener datos base
      if (service.condicionContractualId && !service.tipoServicio) {
        const condicion = await this.condicionesContractualesRepository.findOne(
          {
            where: { condicionContractualId: service.condicionContractualId },
          },
        );

        if (condicion?.tipo_servicio) {
          service.tipoServicio = condicion.tipo_servicio;
          if (service.cantidadBanos === undefined && condicion.cantidad_banos) {
            service.cantidadBanos = condicion.cantidad_banos;
          }
        }
      }

      if (!service.tipoServicio) {
        throw new BadRequestException('El tipo de servicio es obligatorio');
      }

      const requiereNuevosBanos = [
        ServiceType.INSTALACION,
        ServiceType.TRASLADO,
        ServiceType.REUBICACION,
      ].includes(service.tipoServicio);

      const requiereBanosInstalados = [
        ServiceType.LIMPIEZA,
        ServiceType.REEMPLAZO,
        ServiceType.RETIRO,
        ServiceType.MANTENIMIENTO_IN_SITU,
        ServiceType.REPARACION,
      ].includes(service.tipoServicio);

      const employeesNeeded = service.cantidadEmpleados ?? 0;
      const vehiclesNeeded = service.cantidadVehiculos ?? 0;
      const toiletsNeeded = requiereNuevosBanos ? service.cantidadBanos : 0;

      if (requiereNuevosBanos && service.cantidadBanos <= 0) {
        throw new BadRequestException(
          `Para servicios de tipo ${service.tipoServicio}, debe especificar una cantidad de baños mayor a 0`,
        );
      }

      if (requiereBanosInstalados) {
        if (!service.banosInstalados?.length) {
          throw new BadRequestException(
            `Para servicios de ${service.tipoServicio}, debe especificar los IDs de los baños instalados`,
          );
        }

        for (const banoId of service.banosInstalados) {
          const bano = await this.toiletsRepository.findOne({
            where: { baño_id: banoId },
          });

          if (!bano) {
            throw new BadRequestException(`El baño con ID ${banoId} no existe`);
          }

          if (
            ![ResourceState.ASIGNADO, ResourceState.DISPONIBLE].includes(
              bano.estado,
            )
          ) {
            throw new BadRequestException(
              `El baño con ID ${banoId} no está en estado válido. Estado actual: ${bano.estado}`,
            );
          }
        }
      }

      const fechaServicio = new Date(service.fechaProgramada);

      // ✅ EMPLEADOS
      if (employeesNeeded > 0) {
        const empleadosResponse = await this.employeesService.findAll({
          page: 1,
          limit: 100,
        });
        const empleados = (empleadosResponse.data ?? []) as Empleado[];

        const candidatos = empleados.filter((e) =>
          [ResourceState.DISPONIBLE, ResourceState.ASIGNADO].includes(
            e.estado as ResourceState,
          ),
        );

        const disponibles: Empleado[] = [];

        for (const emp of candidatos) {
          const enLicencia =
            !(await this.employeeLeavesService.isEmployeeAvailable(
              emp.id,
              fechaServicio,
            ));
          if (enLicencia) {
            throw new BadRequestException(
              `El empleado ${emp.id} está en licencia o capacitación en la fecha del servicio.`,
            );
          }

          const conflicto = await this.serviceRepository
            .createQueryBuilder('servicio')
            .innerJoin('servicio.asignaciones', 'asig')
            .innerJoin('asig.empleado', 'emp')
            .andWhere('emp.id = :id', { id: emp.id })
            .andWhere('servicio.fechaProgramada = :fecha', {
              fecha: fechaServicio,
            })
            .andWhere(
              incremental && existingService
                ? 'servicio.id != :servicioId'
                : '1=1',
              { servicioId: existingService?.id },
            )
            .getOne();

          if (conflicto) {
            alertas.push(
              `Empleado ${emp.id} ya asignado al servicio ${conflicto.id} en esa fecha`,
            );
          }

          disponibles.push(emp);
        }

        if (disponibles.length < employeesNeeded) {
          throw new BadRequestException(
            `No hay suficientes empleados disponibles. Se necesitan ${employeesNeeded}, hay ${disponibles.length}`,
          );
        }
      } // ✅ VEHICULOS
      if (vehiclesNeeded > 0) {
        const vehicles = await this.vehiclesRepository.find({
          where: [
            { estado: ResourceState.DISPONIBLE },
            { estado: ResourceState.ASIGNADO },
          ],
        });

        const disponibles: Vehicle[] = [];

        for (const vehicle of vehicles) {
          const conflicto = await this.serviceRepository
            .createQueryBuilder('servicio')
            .innerJoin('servicio.asignaciones', 'asig')
            .innerJoin('asig.vehiculo', 'veh')
            .where('veh.id = :id', { id: vehicle.id })
            .andWhere('servicio.fechaProgramada = :fecha', {
              fecha: fechaServicio,
            })
            .andWhere(
              incremental && existingService
                ? 'servicio.id != :servicioId'
                : '1=1',
              { servicioId: existingService?.id },
            )
            .getOne();

          if (conflicto) {
            alertas.push(
              `Vehículo ${vehicle.id} ya asignado al servicio ${conflicto.id} en esa fecha`,
            );
          }

          disponibles.push(vehicle);
        }

        if (disponibles.length < vehiclesNeeded) {
          throw new BadRequestException(
            `No hay suficientes vehículos disponibles. Se necesitan ${vehiclesNeeded}, hay ${disponibles.length}`,
          );
        }
      }

      // ✅ BAÑOS NUEVOS
      if (toiletsNeeded > 0) {
        const disponibles = await this.toiletsRepository.find({
          where: { estado: ResourceState.DISPONIBLE },
        });

        if (disponibles.length < toiletsNeeded) {
          throw new BadRequestException(
            `No hay suficientes baños disponibles. Se necesitan ${toiletsNeeded}, hay ${disponibles.length}`,
          );
        }
      }

      // ✅ VALIDAR BAÑOS INSTALADOS - Verificar que no estén asignados a otros servicios
      if (requiereBanosInstalados && service.banosInstalados?.length) {
        for (const banoId of service.banosInstalados) {
          const conflicto = await this.serviceRepository
            .createQueryBuilder('servicio')
            .innerJoin('servicio.asignaciones', 'asig')
            .innerJoin('asig.bano', 'bano')
            .where('bano.baño_id = :banoId', { banoId })
            .andWhere('servicio.fechaProgramada = :fecha', {
              fecha: fechaServicio,
            })
            .andWhere('servicio.estado IN (:...estados)', {
              estados: [ServiceState.PROGRAMADO, ServiceState.EN_PROGRESO],
            })
            .andWhere(
              incremental && existingService
                ? 'servicio.id != :servicioId'
                : '1=1',
              { servicioId: existingService?.id },
            )
            .getOne();

          if (conflicto) {
            throw new BadRequestException(
              `El baño ${banoId} ya está asignado al servicio ${conflicto.id} en la fecha ${fechaServicio.toLocaleDateString()}`,
            );
          }
        }
      }

      // 🔴 ⛔️ BLOQUE NUEVO — Lanzar excepción si hay conflictos detectados y no se está forzando
      if (alertas.length > 0) {
        this.logger.warn(
          'Conflictos detectados con recursos asignados (no se bloqueará la creación):',
        );
        alertas.forEach((msg) => this.logger.warn(msg));

        // Opcional: podrías guardar estas alertas dentro del objeto servicio si querés
        (service as any).__conflictosAsignacion = alertas;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(
        `Error al verificar disponibilidad: ${message}`,
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
  }

  async getCapacitacionServices(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{
    data: Service[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.cliente', 'cliente')
      .leftJoinAndSelect('service.asignaciones', 'asignaciones')
      .leftJoinAndSelect('asignaciones.empleado', 'empleado')
      .leftJoinAndSelect('asignaciones.vehiculo', 'vehiculo')
      .leftJoinAndSelect('asignaciones.bano', 'bano')
      .where('service.tipoServicio = :tipoServicio', {
        tipoServicio: ServiceType.CAPACITACION,
      });

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(service.estado::text) LIKE :term OR ' +
          "COALESCE(LOWER(cliente.nombre_empresa), '') LIKE :term OR " +
          "COALESCE(LOWER(service.ubicacion), '') LIKE :term OR " +
          "COALESCE(LOWER(service.notas), '') LIKE :term)",
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
  }

  async getInstalacionServices(
    page: number,
    limit: number,
  ): Promise<{
    data: Service[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.cliente', 'cliente')
      .leftJoinAndSelect('service.asignaciones', 'asignaciones')
      .leftJoinAndSelect('asignaciones.empleado', 'empleado')
      .leftJoinAndSelect('asignaciones.vehiculo', 'vehiculo')
      .leftJoinAndSelect('asignaciones.bano', 'bano')
      .where('service.tipoServicio = :tipoServicio', {
        tipoServicio: ServiceType.INSTALACION,
      })
      .orderBy('service.fechaProgramada', 'ASC');

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
  }

  async getLimpiezaServices(
    page: number,
    limit: number,
  ): Promise<{
    data: Service[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }> {
    const serviceTypes = [
      ServiceType.LIMPIEZA,
      ServiceType.MANTENIMIENTO,
      ServiceType.MANTENIMIENTO_IN_SITU,
      ServiceType.REPARACION,
      ServiceType.REEMPLAZO,
      ServiceType.RETIRO,
      ServiceType.TRASLADO,
      ServiceType.REUBICACION,
    ];

    const queryBuilder = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.cliente', 'cliente')
      .leftJoinAndSelect('service.asignaciones', 'asignaciones')
      .leftJoinAndSelect('asignaciones.empleado', 'empleado')
      .leftJoinAndSelect('asignaciones.vehiculo', 'vehiculo')
      .leftJoinAndSelect('asignaciones.bano', 'bano')
      .where('service.tipoServicio IN (:...serviceTypes)', { serviceTypes })
      .orderBy('service.fechaProgramada', 'ASC');

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
  }

  async getLastServices(employeeId: number) {
    this.logger.log(
      `Obteniendo últimos servicios realizados por el empleado ${employeeId}`,
    );

    try {
      const services = await this.serviceRepository.find({
        where: {
          estado: ServiceState.COMPLETADO,
          asignaciones: {
            empleadoId: employeeId,
          },
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
        take: 5, // Limitar a los 5 últimos servicios
      });

      if (services.length === 0) {
        this.logger.log(
          `No se encontraron servicios completados para el empleado ${employeeId}`,
        );
      } else {
        this.logger.log(
          `Se encontraron ${services.length} servicios completados para el empleado ${employeeId}`,
        );
      }

      return services;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error al obtener los últimos servicios del empleado ${employeeId}: ${errorMessage}`,
      );
      throw new BadRequestException(
        `Error al obtener los últimos servicios: ${errorMessage}`,
      );
    }
  }

  async getCompletedServices(
    employeeId: number,
    paginationDto: { page?: number; limit?: number; search?: string },
  ): Promise<any> {
    const { page = 1, limit = 10, search } = paginationDto;

    const query = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.asignaciones', 'asignacion')
      .leftJoinAndSelect('asignacion.empleado', 'empleado')
      .leftJoinAndSelect('service.cliente', 'cliente')
      .where('empleado.id = :employeeId', { employeeId })
      .andWhere('service.estado = :estado', {
        estado: ServiceState.COMPLETADO,
      });

    // Add search functionality if needed
    if (search) {
      query.andWhere(
        '(LOWER(cliente.nombre) LIKE :search OR LOWER(service.ubicacion) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Add pagination
    const [servicios, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: servicios,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAssignedPendings(employeeId: number) {
    const services = await this.serviceRepository.find({
      where: {
        estado: ServiceState.PROGRAMADO,
        asignaciones: {
          empleadoId: employeeId,
        },
      },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.empleado',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
    });
    return services;
  }

  async getAssignedInProgress(employeeId: number) {
    const services = await this.serviceRepository.find({
      where: {
        estado: ServiceState.EN_PROGRESO,
        asignaciones: {
          empleadoId: employeeId,
        },
      },
      relations: [
        'cliente',
        'asignaciones',
        'asignaciones.empleado',
        'asignaciones.vehiculo',
        'asignaciones.bano',
      ],
    });
    return services;
  }

  /**
   * Valida la disponibilidad de recursos para un servicio sin crearlo
   * Retorna advertencias y errores de disponibilidad
   */
  async validateResourcesAvailability(dto: CreateServiceDto): Promise<{
    valid: boolean;
    warnings: string[];
    errors: string[];
  }> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Validar baños si se especifican asignaciones manuales
      if (dto.asignacionesManual?.length) {
        for (const assignment of dto.asignacionesManual) {
          if (assignment.banosIds?.length) {
            const banos = await this.toiletsRepository.find({
              where: { baño_id: In(assignment.banosIds) },
            });

            for (const bano of banos) {
              // Error: Baño ASIGNADO
              if (bano.estado === ResourceState.ASIGNADO) {
                errors.push(
                  `El baño ${bano.baño_id} (${bano.codigo_interno}) está en estado ASIGNADO y no puede ser asignado a otro servicio`,
                );
                continue;
              }

              // Advertencia: Baño ya asignado a otro servicio PROGRAMADO
              const existingAssignment = (await this.assignmentRepository
                .createQueryBuilder('asig')
                .innerJoin('asig.servicio', 'servicio')
                .select([
                  'servicio.id as "servicioId"',
                  'servicio.fecha_programada as "fechaProgramada"',
                ])
                .where('asig.bano_id = :banoId', { banoId: bano.baño_id })
                .andWhere('servicio.estado = :estado', {
                  estado: ServiceState.PROGRAMADO,
                })
                .getRawOne()) as
                | { servicioId: number; fechaProgramada: string }
                | undefined;

              if (existingAssignment) {
                const fechaServicio = new Date(
                  existingAssignment.fechaProgramada,
                );
                warnings.push(
                  `El baño ${bano.baño_id} (${bano.codigo_interno}) ya está seleccionado para el servicio ${existingAssignment.servicioId} programado para ${fechaServicio.toLocaleDateString('es-ES')}`,
                );
              }
            }
          }
        }
      }

      // Validar disponibilidad general usando el método existente
      try {
        const tempService = new Service();
        Object.assign(tempService, {
          fechaProgramada: dto.fechaProgramada,
          tipoServicio: dto.tipoServicio,
          cantidadBanos: dto.cantidadBanos,
          cantidadEmpleados: this.getDefaultCantidadEmpleados(dto.tipoServicio),
          cantidadVehiculos: dto.cantidadVehiculos,
          banosInstalados: dto.banosInstalados,
          condicionContractualId: dto.condicionContractualId,
        });

        await this.verifyResourcesAvailability(tempService);
      } catch (error) {
        if (error instanceof BadRequestException) {
          errors.push(error.message);
        }
      }

      return {
        valid: errors.length === 0,
        warnings,
        errors,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      return {
        valid: false,
        warnings,
        errors: [`Error al validar recursos: ${errorMessage}`],
      };
    }
  }
}
