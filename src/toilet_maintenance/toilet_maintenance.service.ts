import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateToiletMaintenanceDto } from './dto/update-toilet_maintenance.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { ChemicalToilet } from '../chemical_toilets/entities/chemical-toilet.entity';
import { Repository } from 'typeorm';
import { CreateToiletMaintenanceDto } from './dto/create-toilet_maintenance.dto';
import { FilterToiletMaintenanceDto } from './dto/filter-toilet_maintenance.dto';

@Injectable()
export class ToiletMaintenanceService {
  constructor(
    @InjectRepository(ToiletMaintenance)
    private maintenanceRepository: Repository<ToiletMaintenance>,
    @InjectRepository(ChemicalToilet)
    private toiletsRepository: Repository<ChemicalToilet>,
  ) {}

  // Método para crear un nuevo mantenimiento de baño
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

    // Creamos el nuevo objeto de mantenimiento
    const maintenance = this.maintenanceRepository.create({
      ...createMaintenanceDto,
      toilet, // Relacionamos el baño con el mantenimiento
    });

    return await this.maintenanceRepository.save(maintenance);
  }

  async findAll(): Promise<ToiletMaintenance[]> {
    return await this.maintenanceRepository.find({
      relations: ['toilet'], // Aseguramos que se incluya la relación con la entidad ChemicalToilet
    });
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

    // Usamos Object.assign para actualizar el mantenimiento con los nuevos datos
    Object.assign(maintenance, updateMaintenanceDto);

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
