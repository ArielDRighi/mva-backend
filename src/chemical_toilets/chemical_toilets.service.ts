import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<Pagination<ChemicalToilet>> {
    const { limit = 10, page = 1 } = paginationDto;

    const query = this.chemicalToiletRepository.createQueryBuilder('toilet');

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      // First term uses WHERE
      query.where(
        `LOWER(UNACCENT(toilet.estado)) LIKE :searchTerm
        OR LOWER(UNACCENT(toilet.modelo)) LIKE :searchTerm
        OR LOWER(UNACCENT(toilet.codigo_interno)) LIKE :searchTerm`,
        { searchTerm: `%${searchTerms[0]}%` },
      );

      // Additional terms use AND with OR conditions for each field
      for (let i = 1; i < searchTerms.length; i++) {
        query.andWhere(
          `LOWER(UNACCENT(toilet.estado)) LIKE :searchTerm${i}
          OR LOWER(UNACCENT(toilet.modelo)) LIKE :searchTerm${i}
          OR LOWER(UNACCENT(toilet.codigo_interno)) LIKE :searchTerm${i}`,
          { [`searchTerm${i}`]: `%${searchTerms[i]}%` },
        );
      }
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

    const query = this.chemicalToiletRepository.createQueryBuilder('toilet');

    if (estado) {
      query.andWhere(
        'LOWER(UNACCENT(toilet.estado)) LIKE LOWER(UNACCENT(:estado))',
        {
          estado: `%${estado}%`,
        },
      );
    }

    if (modelo) {
      query.andWhere(
        'LOWER(UNACCENT(toilet.modelo)) LIKE LOWER(UNACCENT(:modelo))',
        {
          modelo: `%${modelo}%`,
        },
      );
    }

    if (codigoInterno) {
      query.andWhere(
        'LOWER(UNACCENT(toilet.codigo_interno)) LIKE LOWER(UNACCENT(:codigoInterno))',
        {
          codigoInterno: `%${codigoInterno}%`,
        },
      );
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
      relations: ['maintenances'],
    });

    if (!toilet) {
      throw new NotFoundException(`Baño químico con ID ${id} no encontrado`);
    }

    // Check if the toilet is assigned to any service
    const toiletWithAssignments = await this.chemicalToiletRepository
      .createQueryBuilder('toilet')
      .leftJoinAndSelect(
        'asignacion_recursos',
        'asignacion',
        'asignacion.bano_id = toilet.baño_id',
      )
      .leftJoinAndSelect(
        'servicios',
        'servicio',
        'asignacion.servicio_id = servicio.servicio_id',
      )
      .where('toilet.baño_id = :id', { id })
      .andWhere('asignacion.bano_id IS NOT NULL')
      .getOne();

    if (toiletWithAssignments) {
      throw new BadRequestException(
        `El baño químico no puede ser eliminado ya que se encuentra asignado a uno o más servicios.`,
      );
    }

    // Check if the toilet has pending/scheduled maintenance
    if (
      toilet.maintenances &&
      toilet.maintenances.some((maintenance) => !maintenance.completado)
    ) {
      throw new BadRequestException(
        `El baño químico no puede ser eliminado ya que tiene mantenimientos programados pendientes.`,
      );
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

  async getTotalChemicalToilets(): Promise<{
    total: number;
    totalDisponibles: number;
    totalMantenimiento: number;
    totalAsignado: number;
  }> {
    const total = await this.chemicalToiletRepository.count();
    const totalDisponibles = await this.chemicalToiletRepository.count({
      where: { estado: ResourceState.DISPONIBLE },
    });
    const totalMantenimiento = await this.chemicalToiletRepository.count({
      where: { estado: ResourceState.EN_MANTENIMIENTO },
    });
    const totalAsignado = await this.chemicalToiletRepository.count({
      where: { estado: ResourceState.ASIGNADO },
    });
    return {
      total,
      totalDisponibles,
      totalMantenimiento,
      totalAsignado,
    };
  }
}
