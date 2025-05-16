import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateToiletMaintenanceDto } from './dto/update_toilet_maintenance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical_toilet.entity';
import { Repository, Between, MoreThan, Not } from 'typeorm';
import { CreateToiletMaintenanceDto } from './dto/create_toilet_maintenance.dto';
import { FilterToiletMaintenanceDto } from './dto/filter_toilet_maintenance.dto';
import { ResourceState } from '../common/enums/resource-states.enum';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import { Cron } from '@nestjs/schedule';
import { Periodicidad } from 'src/contractual_conditions/entities/contractual_conditions.entity';
import { Pagination } from 'src/common/interfaces/paginations.interface';

@Injectable()
export class ToiletMaintenanceService {
  constructor(
    @InjectRepository(ToiletMaintenance)
    private maintenanceRepository: Repository<ToiletMaintenance>,
    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,
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
    maintenanceDates.push(new Date(currentDate));

    // Determinar el intervalo según la periodicidad
    let intervalDays: number;
    switch (periodicidad) {
      case Periodicidad.DIARIA:
        intervalDays = 1;
        break;
      case Periodicidad.SEMANAL:
        intervalDays = 7;
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

    // Verificar que el baño está disponible
    if (toilet.estado !== ResourceState.DISPONIBLE) {
      throw new BadRequestException(
        `El baño químico no está disponible para mantenimiento. Estado actual: ${toilet.estado}`,
      );
    }

    // Verificar la fecha del mantenimiento
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Inicio del día actual

    const maintenanceDate = new Date(createMaintenanceDto.fecha_mantenimiento);
    maintenanceDate.setHours(0, 0, 0, 0); // Inicio del día de mantenimiento

    // Verificar que la fecha no sea anterior a hoy
    if (maintenanceDate < now) {
      throw new BadRequestException(
        `No se puede programar un mantenimiento para una fecha pasada. Fecha mínima: ${now.toISOString().split('T')[0]}`,
      );
    }

    // 1. Verificar si ya existe un mantenimiento programado para este baño en la misma fecha
    const hasSameDateMaintenance = await this.hasScheduledMaintenance(
      createMaintenanceDto.baño_id,
      maintenanceDate,
    );

    if (hasSameDateMaintenance) {
      throw new BadRequestException(
        `El baño ya tiene un mantenimiento programado para la fecha ${maintenanceDate.toISOString().split('T')[0]}`,
      );
    }

    // 2. Verificar si existen CUALQUIER mantenimiento pendiente para este baño
    const hasAnyPendingMaintenance = await this.hasAnyPendingMaintenances(
      createMaintenanceDto.baño_id,
    );

    if (hasAnyPendingMaintenance) {
      throw new BadRequestException(
        `No se puede programar este mantenimiento porque el baño ya tiene mantenimientos programados para otras fechas. No se pueden programar múltiples mantenimientos para un mismo baño.`,
      );
    }

    if (maintenanceDate.getTime() === now.getTime()) {
      // El mantenimiento es para hoy, cambiar estado inmediatamente
      await this.chemicalToiletsService.update(toilet.baño_id, {
        estado: ResourceState.EN_MANTENIMIENTO,
      });

      // Actualizar también el estado en el objeto en memoria
      toilet.estado = ResourceState.EN_MANTENIMIENTO;
    }
    // Si es para una fecha futura, no cambiar el estado ahora

    // Creamos el nuevo objeto de mantenimiento
    const maintenance = this.maintenanceRepository.create({
      ...createMaintenanceDto,
      toilet, // Relacionamos el baño con el mantenimiento
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

  // Verifica si hay mantenimientos existentes para un baño (cualquier fecha)
  async hasAnyPendingMaintenances(banoId: number): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar cualquier mantenimiento futuro no completado para este baño
    const pendingMaintenanceCount = await this.maintenanceRepository.count({
      where: {
        toilet: { baño_id: banoId },
        fecha_mantenimiento: MoreThan(today),
        completado: false,
      },
    });

    return pendingMaintenanceCount > 0;
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

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<Pagination<ToiletMaintenance>> {
    const [items, total] = await this.maintenanceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['toilet'],
      order: {
        fecha_mantenimiento: 'DESC',
      },
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(mantenimiento_id: number): Promise<ToiletMaintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { mantenimiento_id },
      relations: ['toilet'], // Incluimos la relación con ChemicalToilet
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
      relations: ['toilet'], // Incluimos la relación con ChemicalToilet
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

    // Si se está actualizando la fecha, realizar validaciones adicionales
    if (updateMaintenanceDto.fecha_mantenimiento) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const banoId = updateMaintenanceDto.baño_id || maintenance.toilet.baño_id;
      await this.validateMaintenanceDateUpdate(
        mantenimiento_id,
        banoId,
        new Date(updateMaintenanceDto.fecha_mantenimiento),
        maintenance.completado,
      );

      // Si la fecha cambió al día actual, cambiar estado del baño a EN_MANTENIMIENTO
      const newDate = new Date(updateMaintenanceDto.fecha_mantenimiento);
      newDate.setHours(0, 0, 0, 0);
      if (newDate.getTime() === now.getTime() && !maintenance.completado) {
        await this.chemicalToiletsService.update(banoId, {
          estado: ResourceState.EN_MANTENIMIENTO,
        });
      }
    }

    // Usamos Object.assign para actualizar el mantenimiento con los nuevos datos
    Object.assign(maintenance, updateMaintenanceDto);

    // Guardamos el mantenimiento actualizado en la base de datos
    return await this.maintenanceRepository.save(maintenance);
  }
  // Método auxiliar para validar actualizaciones de fecha de mantenimiento
  async validateMaintenanceDateUpdate(
    mantenimiento_id: number,
    banoId: number,
    newDate: Date,
    isCompleted: boolean,
  ): Promise<void> {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Inicio del día actual

    const newMaintenanceDate = new Date(newDate);
    newMaintenanceDate.setHours(0, 0, 0, 0); // Inicio del día de mantenimiento

    // Verificar que la fecha no sea anterior a hoy
    if (newMaintenanceDate < now) {
      throw new BadRequestException(
        `No se puede programar un mantenimiento para una fecha pasada. Fecha mínima: ${now.toISOString().split('T')[0]}`,
      );
    }

    // Si el mantenimiento ya está completado, no permitir cambiar la fecha
    if (isCompleted) {
      throw new BadRequestException(
        `No se puede modificar la fecha de un mantenimiento ya completado.`,
      );
    }

    // 1. Verificar si ya existe un mantenimiento programado para este baño en la misma fecha
    const startOfDay = new Date(newMaintenanceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(newMaintenanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    const hasSameDateMaintenance = await this.maintenanceRepository.count({
      where: {
        toilet: { baño_id: banoId },
        fecha_mantenimiento: Between(startOfDay, endOfDay),
        completado: false,
        mantenimiento_id: Not(mantenimiento_id), // Excluir el mantenimiento actual
      },
    });

    if (hasSameDateMaintenance > 0) {
      throw new BadRequestException(
        `El baño ya tiene un mantenimiento programado para la fecha ${newMaintenanceDate.toISOString().split('T')[0]}`,
      );
    }

    // 2. Verificar si hay mantenimientos pendientes para este baño (excluyendo el actual)
    const pendingMaintenanceCount = await this.maintenanceRepository.count({
      where: {
        toilet: { baño_id: banoId },
        fecha_mantenimiento: MoreThan(now),
        completado: false,
        mantenimiento_id: Not(mantenimiento_id), // Excluir el mantenimiento actual
      },
    });

    if (pendingMaintenanceCount > 0) {
      throw new BadRequestException(
        `No se puede programar este mantenimiento porque el baño ya tiene mantenimientos programados para otras fechas. No se pueden programar múltiples mantenimientos para un mismo baño.`,
      );
    }
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

  async findAllWithFilters(
    filterDto: FilterToiletMaintenanceDto,
  ): Promise<ToiletMaintenance[]> {
    const query = this.maintenanceRepository
      .createQueryBuilder('maintenance')
      .leftJoinAndSelect('maintenance.toilet', 'toilet');

    if (filterDto.baño_id) {
      const toiletId = parseInt(String(filterDto.baño_id), 10);
      if (!isNaN(toiletId)) {
        query.andWhere('toilet.baño_id = :toiletId', { toiletId });
      }
    }

    if (filterDto.tipo_mantenimiento) {
      query.andWhere('maintenance.tipo_mantenimiento LIKE :tipo', {
        tipo: `%${filterDto.tipo_mantenimiento}%`,
      });
    }

    if (filterDto.tecnico_responsable) {
      query.andWhere('maintenance.tecnico_responsable LIKE :tecnico', {
        tecnico: `%${filterDto.tecnico_responsable}%`,
      });
    }

    if (filterDto.fechaDesde) {
      query.andWhere('maintenance.fecha_mantenimiento >= :fechaDesde', {
        fechaDesde: filterDto.fechaDesde,
      });
    }

    if (filterDto.fechaHasta) {
      query.andWhere('maintenance.fecha_mantenimiento <= :fechaHasta', {
        fechaHasta: filterDto.fechaHasta,
      });
    }

    return await query.getMany();
  }

  async getMantenimientosStats(baño_id: number): Promise<any> {
    const maintenances = await this.maintenanceRepository.find({
      where: { toilet: { baño_id } },
      relations: ['toilet'],
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
      relations: ['toilet'],
    });

    // Cambiar estado de los baños a EN_MANTENIMIENTO
    for (const maintenance of todaysMaintenances) {
      if (maintenance.toilet) {
        await this.chemicalToiletsService.update(maintenance.toilet.baño_id, {
          estado: ResourceState.EN_MANTENIMIENTO,
        });
      }
    }
  }
}
