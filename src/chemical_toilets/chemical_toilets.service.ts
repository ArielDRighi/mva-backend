import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateChemicalToiletDto } from './dto/create_chemical_toilet.dto';
import { UpdateChemicalToiletDto } from './dto/update_chemical.toilet.dto';
import { FilterChemicalToiletDto } from './dto/filter_chemical_toilet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChemicalToilet } from './entities/chemical_toilet.entity';
import { Repository } from 'typeorm';
import { ResourceState } from '../common/enums/resource-states.enum';
import { Service } from '../services/entities/service.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Pagination } from 'src/common/interfaces/paginations.interface';

@Injectable()
export class ChemicalToiletsService {
  constructor(
    @InjectRepository(ChemicalToilet)
    private chemicalToiletRepository: Repository<ChemicalToilet>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
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

  async findAll(paginationDto: PaginationDto): Promise<Pagination<ChemicalToilet>> {
    const { limit = 10, page = 1 } = paginationDto;
  
    const [items, total] = await this.chemicalToiletRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
  
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllWithFilters(
    filterDto: FilterChemicalToiletDto,
  ): Promise<Pagination<ChemicalToilet>> {
    const {
      estado,
      modelo,
      codigoInterno,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 10,
    } = filterDto;
  
    const query = this.chemicalToiletRepository
      .createQueryBuilder('toilet');
  
    if (estado) {
      query.andWhere('toilet.estado = :estado', { estado });
    }
  
    if (modelo) {
      query.andWhere('toilet.modelo LIKE :modelo', {
        modelo: `%${modelo}%`,
      });
    }
  
    if (codigoInterno) {
      query.andWhere('toilet.codigo_interno LIKE :codigoInterno', {
        codigoInterno: `%${codigoInterno}%`,
      });
    }
  
    if (fechaDesde) {
      query.andWhere('toilet.fecha_adquisicion >= :fechaDesde', {
        fechaDesde,
      });
    }
  
    if (fechaHasta) {
      query.andWhere('toilet.fecha_adquisicion <= :fechaHasta', {
        fechaHasta,
      });
    }
  
    query.skip((page - 1) * limit).take(limit);
  
    const [items, total] = await query.getManyAndCount();
  
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllByState(
    estado: ResourceState,
    paginationDto: PaginationDto,
  ): Promise<ChemicalToilet[]> {
    const { page = 1, limit = 10 } = paginationDto;
  
    return this.chemicalToiletRepository.find({
      where: { estado },
      skip: (page - 1) * limit,
      take: limit,
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

  async findByClientId(clientId: number): Promise<ChemicalToilet[]> {
    // Buscar baños en estado ASIGNADO que estén vinculados al cliente
    const toilets = await this.chemicalToiletRepository
      .createQueryBuilder('bano')
      .innerJoin(
        'asignacion_recursos',
        'asignacion',
        'asignacion.bano_id = bano.baño_id',
      )
      .innerJoin(
        'servicios',
        'service',
        'service.servicio_id = asignacion.servicio_id',
      )
      .where('service.cliente_id = :clientId', { clientId })
      .andWhere('bano.estado = :estado', {
        estado: ResourceState.ASIGNADO.toString(),
      })
      .getMany();

    return toilets;
  }
}
