import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateToiletMaintenanceDto } from './dto/update_toilet_maintenance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Empleado } from '../employees/entities/employee.entity';
import { Repository, Between } from 'typeorm';
import { CreateToiletMaintenanceDto } from './dto/create_toilet_maintenance.dto';
import { ResourceState } from '../common/enums/resource-states.enum';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import { Cron } from '@nestjs/schedule';
import { Periodicidad } from 'src/contractual_conditions/entities/contractual_conditions.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ToiletMaintenanceService {
  constructor(
    @InjectRepository(ToiletMaintenance)
    private maintenanceRepository: Repository<ToiletMaintenance>,
    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,
    @InjectRepository(Empleado)
    private empleadoRepository: Repository<Empleado>,
    private chemicalToiletsService: ChemicalToiletsService,
  ) {}

  calculateMaintenanceDays(
    fechaInicio: Date | null,
    fechaFin: Date | null,
    periodicidad: Periodicidad,
  ): Date[] {
    if (!fechaInicio || !fechaFin) {
      throw new BadRequestException('Fechas de inicio o fin no válidas');
    }

    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);

    // Verificar que la fecha de inicio sea anterior a la fecha de fin
    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    const maintenanceDates: Date[] = [];
    let currentDate = new Date(startDate);

    // La primera fecha de mantenimiento es la fecha de inicio
    maintenanceDates.push(new Date(currentDate)); // Determinar el intervalo según la periodicidad
    let intervalDays: number;
    switch (periodicidad) {
      case Periodicidad.DIARIA:
        intervalDays = 1;
        break;
      case Periodicidad.DOS_VECES_SEMANA:
        intervalDays = 3.5; // 7 días / 2 veces = 3.5 días
        break;
      case Periodicidad.TRES_VECES_SEMANA:
        intervalDays = 2.33; // 7 días / 3 veces ≈ 2.33 días
        break;
      case Periodicidad.CUATRO_VECES_SEMANA:
        intervalDays = 1.75; // 7 días / 4 veces = 1.75 días
        break;
      case Periodicidad.SEMANAL:
        intervalDays = 7;
        break;
      case Periodicidad.QUINCENAL:
        intervalDays = 15; // Aproximación de dos semanas
        break;
      case Periodicidad.MENSUAL:
        intervalDays = 30; // Aproximación de un mes
        break;
      case Periodicidad.ANUAL:
        intervalDays = 365; // Aproximación de un año
        break;
      default:
        throw new BadRequestException('Periodicidad no válida');
    }

    // Calcular las fechas de mantenimiento siguientes
    while (true) {
      // Avanzar a la siguiente fecha según la periodicidad
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + intervalDays);

      // Si la siguiente fecha supera la fecha fin, terminamos
      if (nextDate > endDate) {
        break;
      }

      // Agregar la fecha a la lista de mantenimientos
      maintenanceDates.push(new Date(nextDate));
      currentDate = nextDate;
    }

    return maintenanceDates;
  }

  async create(
    createMaintenanceDto: CreateToiletMaintenanceDto,
  ): Promise<ToiletMaintenance> {
    // Verificamos si el baño existe
    const toilet = await this.toiletsRepository.findOne({
      where: { baño_id: createMaintenanceDto.baño_id },
    });

    if (!toilet) {
      throw new NotFoundException(
        `Baño con ID ${createMaintenanceDto.baño_id} no encontrado`,
      );
    }

    // Verificamos si el empleado existe
    const empleado = await this.empleadoRepository.findOne({
      where: { id: createMaintenanceDto.empleado_id },
    });

    if (!empleado) {
      throw new NotFoundException(
        `Empleado con ID ${createMaintenanceDto.empleado_id} no encontrado`,
      );
    }

    // Verificar que el baño está disponible
    if (toilet.estado !== ResourceState.DISPONIBLE) {
      throw new BadRequestException(
        `El baño químico no está disponible para mantenimiento. Estado actual: ${toilet.estado}`,
      );
    }

    // CAMBIO CLAVE: Solo cambiar estado si el mantenimiento es para hoy o antes
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Inicio del día actual

    const maintenanceDate = new Date(createMaintenanceDto.fecha_mantenimiento);
    maintenanceDate.setHours(0, 0, 0, 0); // Inicio del día de mantenimiento

    if (maintenanceDate <= now) {
      // El mantenimiento es para hoy o una fecha pasada, cambiar estado inmediatamente
      await this.chemicalToiletsService.update(toilet.baño_id, {
        estado: ResourceState.MANTENIMIENTO,
      });

      // Actualizar también el estado en el objeto en memoria
      toilet.estado = ResourceState.MANTENIMIENTO;
    }
    // Si es para una fecha futura, no cambiar el estado ahora    // Creamos el nuevo objeto de mantenimiento
    const maintenance = this.maintenanceRepository.create({
      fecha_mantenimiento: createMaintenanceDto.fecha_mantenimiento,
      tipo_mantenimiento: createMaintenanceDto.tipo_mantenimiento,
      descripcion: createMaintenanceDto.descripcion,
      costo: createMaintenanceDto.costo,
      toilet, // Relacionamos el baño con el mantenimiento
      tecnicoResponsable: empleado, // Relacionamos el empleado con el mantenimiento
      completado: false, // Agregamos campo para controlar si está completado
    });

    return await this.maintenanceRepository.save(maintenance);
  }

  // Método para completar un mantenimiento y devolver el baño a DISPONIBLE
  async completeMaintenace(id: number): Promise<ToiletMaintenance> {
    const maintenance = await this.findById(id);

    // Marcar como completado
    maintenance.completado = true;
    maintenance.fechaCompletado = new Date();

    if (maintenance.toilet) {
      // Cambiar el estado del baño a DISPONIBLE
      await this.chemicalToiletsService.update(maintenance.toilet.baño_id, {
        estado: ResourceState.DISPONIBLE,
      });

      // Actualizar el estado del baño en el objeto en memoria también
      maintenance.toilet.estado = ResourceState.DISPONIBLE;
    } else {
      // Si maintenance.toilet no está cargado, hay que obtener la referencia al baño
      // Primero necesitamos obtener el ID del baño asociado a este mantenimiento
      const maintenanceWithToilet = await this.maintenanceRepository.findOne({
        where: { mantenimiento_id: id },
        relations: ['toilet'],
      });

      if (maintenanceWithToilet && maintenanceWithToilet.toilet) {
        // Ahora sí podemos obtener el ID del baño y actualizarlo
        await this.chemicalToiletsService.update(
          maintenanceWithToilet.toilet.baño_id,
          {
            estado: ResourceState.DISPONIBLE,
          },
        );

        // Y actualizar la referencia en el objeto actual
        maintenance.toilet = maintenanceWithToilet.toilet;
      }
    }

    return this.maintenanceRepository.save(maintenance);
  }

  // Verificar si un baño tiene mantenimiento programado para una fecha
  async hasScheduledMaintenance(banoId: number, fecha: Date): Promise<boolean> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    const maintenanceCount = await this.maintenanceRepository.count({
      where: {
        toilet: { baño_id: banoId },
        fecha_mantenimiento: Between(startOfDay, endOfDay),
        completado: false, // Sólo considerar mantenimientos no completados
      },
    });

    return maintenanceCount > 0;
  }
  async findAll(paginationDto: PaginationDto): Promise<{
    data: ToiletMaintenance[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 10, search } = paginationDto;

    const queryBuilder = this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.toilet', 'toilet')
      .leftJoinAndSelect('maintenance.tecnicoResponsable', 'empleado');

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      // First term uses WHERE
      queryBuilder.where(
        `LOWER(UNACCENT(maintenance.tipo_mantenimiento)) LIKE :term0
        OR LOWER(UNACCENT(CAST(maintenance.completado AS TEXT))) LIKE :term0
        OR LOWER(UNACCENT(toilet.codigo_interno)) LIKE :term0
        OR LOWER(UNACCENT(toilet.modelo)) LIKE :term0
        OR LOWER(UNACCENT(empleado.nombre)) LIKE :term0
        OR LOWER(UNACCENT(empleado.apellido)) LIKE :term0
        OR LOWER(UNACCENT(CONCAT(empleado.nombre, ' ', empleado.apellido))) LIKE :term0`,
        { term0: `%${searchTerms[0]}%` },
      );

      // Additional terms use AND
      for (let i = 1; i < searchTerms.length; i++) {
        queryBuilder.andWhere(
          `LOWER(UNACCENT(maintenance.tipo_mantenimiento)) LIKE :term${i}
          OR LOWER(UNACCENT(CAST(maintenance.completado AS TEXT))) LIKE :term${i}
          OR LOWER(UNACCENT(toilet.codigo_interno)) LIKE :term${i}
          OR LOWER(UNACCENT(toilet.modelo)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.nombre)) LIKE :term${i}
          OR LOWER(UNACCENT(empleado.apellido)) LIKE :term${i}
          OR LOWER(UNACCENT(CONCAT(empleado.nombre, ' ', empleado.apellido))) LIKE :term${i}`,
          { [`term${i}`]: `%${searchTerms[i]}%` },
        );
      }
    }

    queryBuilder
      .orderBy('maintenance.mantenimiento_id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
  async getUpcomingMaintenances(): Promise<ToiletMaintenance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // El inicio del día de hoy

    return this.maintenanceRepository.find({
      where: {
        fecha_mantenimiento: Between(today, new Date('9999-12-31')),
        completado: false,
      },
      relations: ['toilet', 'tecnicoResponsable'],
      order: {
        fecha_mantenimiento: 'ASC',
      },
    });
  }
  async findById(mantenimiento_id: number): Promise<ToiletMaintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { mantenimiento_id },
      relations: ['toilet', 'tecnicoResponsable'], // Incluimos las relaciones con ChemicalToilet y Empleado
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    return maintenance;
  }
  async update(
    mantenimiento_id: number,
    updateMaintenanceDto: UpdateToiletMaintenanceDto,
  ): Promise<ToiletMaintenance> {
    // Verificamos si el mantenimiento existe
    const maintenance = await this.maintenanceRepository.findOne({
      where: { mantenimiento_id },
      relations: ['toilet', 'tecnicoResponsable'], // Incluimos las relaciones con ChemicalToilet y Empleado
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    // Verificamos si el baño existe (si se está actualizando)
    if (updateMaintenanceDto.baño_id) {
      const toilet = await this.toiletsRepository.findOne({
        where: { baño_id: updateMaintenanceDto.baño_id },
      });

      if (!toilet) {
        throw new NotFoundException(
          `Baño con ID ${updateMaintenanceDto.baño_id} no encontrado`,
        );
      }

      maintenance.toilet = toilet;
    }

    // Verificamos si el empleado existe (si se está actualizando)
    if (updateMaintenanceDto.empleado_id) {
      const empleado = await this.empleadoRepository.findOne({
        where: { id: updateMaintenanceDto.empleado_id },
      });

      if (!empleado) {
        throw new NotFoundException(
          `Empleado con ID ${updateMaintenanceDto.empleado_id} no encontrado`,
        );
      }
      maintenance.tecnicoResponsable = empleado;
    }

    // Creamos una copia del DTO sin el empleado_id para evitar conflictos
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { empleado_id, ...updateData } = updateMaintenanceDto;

    // Usamos Object.assign para actualizar el mantenimiento con los nuevos datos
    Object.assign(maintenance, updateData);

    // Guardamos el mantenimiento actualizado en la base de datos
    return await this.maintenanceRepository.save(maintenance);
  }

  async delete(mantenimiento_id: number): Promise<void> {
    // Verificamos si el mantenimiento existe
    const maintenance = await this.maintenanceRepository.findOne({
      where: { mantenimiento_id },
    });

    if (!maintenance) {
      throw new NotFoundException(
        `Mantenimiento con ID ${mantenimiento_id} no encontrado`,
      );
    }

    // Procedemos a eliminar el mantenimiento
    await this.maintenanceRepository.delete(mantenimiento_id);
  }
  async getMantenimientosStats(baño_id: number): Promise<any> {
    const maintenances = await this.maintenanceRepository.find({
      where: { toilet: { baño_id } },
      relations: ['toilet', 'tecnicoResponsable'],
    });

    if (maintenances.length === 0) {
      throw new NotFoundException(
        `No se encontraron mantenimientos para el baño con ID ${baño_id}`,
      );
    }

    const totalMantenimientos = maintenances.length;
    const costoTotal = maintenances.reduce(
      (sum, m) => sum + Number(m.costo),
      0,
    );
    const costoPromedio = costoTotal / totalMantenimientos;

    // Agrupar por tipo de mantenimiento
    const tiposMantenimiento = maintenances.reduce<Record<string, number>>(
      (acc, m) => {
        acc[m.tipo_mantenimiento] = (acc[m.tipo_mantenimiento] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      totalMantenimientos,
      costoTotal,
      costoPromedio,
      tiposMantenimiento,
      ultimoMantenimiento: maintenances.sort(
        (a, b) =>
          new Date(b.fecha_mantenimiento).getTime() -
          new Date(a.fecha_mantenimiento).getTime(),
      )[0],
    };
  }
}

@Injectable()
export class ToiletMaintenanceSchedulerService {
  constructor(
    @InjectRepository(ToiletMaintenance)
    private toiletMaintenanceRepository: Repository<ToiletMaintenance>,
    private chemicalToiletsService: ChemicalToiletsService,
  ) {}

  @Cron('0 0 * * *') // Ejecutar todos los días a medianoche
  async handleScheduledMaintenances() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar mantenimientos programados para hoy que no estén completados
    const todaysMaintenances = await this.toiletMaintenanceRepository.find({
      where: {
        fecha_mantenimiento: Between(today, tomorrow),
        completado: false,
      },
      relations: ['toilet', 'tecnicoResponsable'],
    });

    // Cambiar estado de los baños a EN_MANTENIMIENTO
    for (const maintenance of todaysMaintenances) {
      if (maintenance.toilet) {
        await this.chemicalToiletsService.update(maintenance.toilet.baño_id, {
          estado: ResourceState.MANTENIMIENTO,
        });
      }
    }
  }
}
