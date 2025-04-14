import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChemicalToiletDto } from './dto/create_chemical_toilet.dto';
import { UpdateChemicalToiletDto } from './dto/update_chemical.toilet.dto';
import { FilterChemicalToiletDto } from './dto/filter_chemical_toilet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChemicalToilet } from './entities/chemical_toilet.entity';
import { Repository } from 'typeorm';
import { ResourceState } from '../common/enums/resource-states.enum';

@Injectable()
export class ChemicalToiletsService {
  constructor(
    @InjectRepository(ChemicalToilet)
    private chemicalToiletRepository: Repository<ChemicalToilet>,
  ) {}

  // Método para crear un baño químico
  async create(
    createChemicalToiletDto: CreateChemicalToiletDto,
  ): Promise<ChemicalToilet> {
    const newToilet = this.chemicalToiletRepository.create(
      createChemicalToiletDto,
    );
    return await this.chemicalToiletRepository.save(newToilet);
  }

  async findAll(): Promise<ChemicalToilet[]> {
    return await this.chemicalToiletRepository.find();
  }

  async findAllWithFilters(
    filterDto: FilterChemicalToiletDto,
  ): Promise<ChemicalToilet[]> {
    const query = this.chemicalToiletRepository.createQueryBuilder('toilet');

    if (filterDto.estado) {
      query.andWhere('toilet.estado = :estado', { estado: filterDto.estado });
    }

    if (filterDto.modelo) {
      query.andWhere('toilet.modelo LIKE :modelo', {
        modelo: `%${filterDto.modelo}%`,
      });
    }

    if (filterDto.codigoInterno) {
      query.andWhere('toilet.codigo_interno LIKE :codigoInterno', {
        codigoInterno: `%${filterDto.codigoInterno}%`,
      });
    }

    if (filterDto.fechaDesde) {
      query.andWhere('toilet.fecha_adquisicion >= :fechaDesde', {
        fechaDesde: filterDto.fechaDesde,
      });
    }

    if (filterDto.fechaHasta) {
      query.andWhere('toilet.fecha_adquisicion <= :fechaHasta', {
        fechaHasta: filterDto.fechaHasta,
      });
    }

    return await query.getMany();
  }

  async findAllByState(estado: ResourceState): Promise<ChemicalToilet[]> {
    return this.chemicalToiletRepository.find({
      where: { estado },
    });
  }

  async findById(id: number): Promise<ChemicalToilet> {
    const toilet = await this.chemicalToiletRepository.findOne({
      where: { baño_id: id },
    });

    if (!toilet) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    return toilet;
  }

  async update(
    id: number,
    updateChemicalToiletDto: UpdateChemicalToiletDto,
  ): Promise<ChemicalToilet> {
    const toilet = await this.chemicalToiletRepository.findOne({
      where: { baño_id: id },
    });

    if (!toilet) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    // Actualizamos los campos del baño con los nuevos valores
    Object.assign(toilet, updateChemicalToiletDto);

    return this.chemicalToiletRepository.save(toilet);
  }

  async remove(id: number): Promise<void> {
    const toilet = await this.chemicalToiletRepository.findOne({
      where: { baño_id: id },
    });

    if (!toilet) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    await this.chemicalToiletRepository.remove(toilet);
  }

  async getMaintenanceStats(id: number): Promise<any> {
    const toilet = await this.chemicalToiletRepository.findOne({
      where: { baño_id: id },
      relations: ['maintenances'],
    });

    if (!toilet) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    // Calcular estadísticas
    const totalMaintenances = toilet.maintenances.length;
    const totalCost = toilet.maintenances.reduce((sum, m) => sum + m.costo, 0);
    const lastMaintenance = toilet.maintenances.sort(
      (a, b) =>
        new Date(b.fecha_mantenimiento).getTime() -
        new Date(a.fecha_mantenimiento).getTime(),
    )[0];

    return {
      totalMaintenances,
      totalCost,
      lastMaintenance: lastMaintenance
        ? {
            fecha: lastMaintenance.fecha_mantenimiento,
            tipo: lastMaintenance.tipo_mantenimiento,
            tecnico: lastMaintenance.tecnico_responsable,
          }
        : null,
      daysSinceLastMaintenance: lastMaintenance
        ? Math.floor(
            (new Date().getTime() -
              new Date(lastMaintenance.fecha_mantenimiento).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null,
    };
  }
}
