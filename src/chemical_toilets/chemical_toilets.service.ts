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

    try {
      return await this.chemicalToiletRepository.save(newToilet);
    } catch (error) {
      if (error.code === '23505') {
        // Error por clave única duplicada (por ejemplo, codigo_interno ya existe)
        throw new BadRequestException(
          'Ya existe un baño químico con ese código interno.',
        );
      }

      // Otros errores no controlados
      throw new BadRequestException('Error al crear el baño químico.');
    }
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<Pagination<ChemicalToilet>> {
    const { limit = 10, page = 1 } = paginationDto;

    const query = this.chemicalToiletRepository.createQueryBuilder('toilet');

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      // Primera condición con CAST en estado
      query.where(
        `LOWER(UNACCENT(CAST(toilet.estado AS TEXT))) LIKE :searchTerm
      OR LOWER(UNACCENT(toilet.modelo)) LIKE :searchTerm
      OR LOWER(UNACCENT(toilet.codigo_interno)) LIKE :searchTerm`,
        { searchTerm: `%${searchTerms[0]}%` },
      );

      // Términos adicionales
      for (let i = 1; i < searchTerms.length; i++) {
        query.andWhere(
          `LOWER(UNACCENT(CAST(toilet.estado AS TEXT))) LIKE :searchTerm${i}
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
      search,
      estado,
      modelo,
      codigoInterno,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 10,
    } = filterDto;

    const query = this.chemicalToiletRepository.createQueryBuilder('toilet');

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      // Primera condición
      query.andWhere(
        `(LOWER(UNACCENT(CAST(toilet.estado AS TEXT))) LIKE :term0
      OR LOWER(UNACCENT(toilet.modelo)) LIKE :term0
      OR LOWER(UNACCENT(toilet.codigo_interno)) LIKE :term0)`,
        { term0: `%${searchTerms[0]}%` },
      );

      // Condiciones adicionales (una por término)
      for (let i = 1; i < searchTerms.length; i++) {
        query.andWhere(
          `(LOWER(UNACCENT(CAST(toilet.estado AS TEXT))) LIKE :term${i}
        OR LOWER(UNACCENT(toilet.modelo)) LIKE :term${i}
        OR LOWER(UNACCENT(toilet.codigo_interno)) LIKE :term${i})`,
          { [`term${i}`]: `%${searchTerms[i]}%` },
        );
      }
    } else {
      if (estado) {
        query.andWhere(
          'LOWER(UNACCENT(CAST(toilet.estado AS TEXT))) LIKE :estado',
          { estado: `%${estado.toLowerCase()}%` },
        );
      }

      if (modelo) {
        query.andWhere('LOWER(UNACCENT(toilet.modelo)) LIKE :modelo', {
          modelo: `%${modelo.toLowerCase()}%`,
        });
      }

      if (codigoInterno) {
        query.andWhere(
          'LOWER(UNACCENT(toilet.codigo_interno)) LIKE :codigoInterno',
          { codigoInterno: `%${codigoInterno.toLowerCase()}%` },
        );
      }
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

    query.orderBy('toilet.baño_id', 'ASC');
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
            tecnico:
              lastMaintenance.tecnicoResponsable?.nombre +
              ' ' +
              lastMaintenance.tecnicoResponsable?.apellido,
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
  async findServicesByToiletId(toiletId: number): Promise<any[]> {
    const services = await this.chemicalToiletRepository
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
      .innerJoin('clients', 'client', 'client.cliente_id = service.cliente_id')
      .select([
        'service.servicio_id as servicioId',
        'service.tipo_servicio as tipoServicio',
        'service.ubicacion as ubicacionServicio',
        'service.notas as notasServicio',
        'service.fecha_programada as fechaProgramada',
        'service.fecha_inicio as fechaInicio',
        'service.fecha_fin as fechaFin',
        'service.estado as estadoServicio',
        'client.cliente_id as clienteId',
        'client.nombre_empresa as clienteNombre',
        'client.email as clienteEmail',
        'client.telefono as clienteTelefono',
        'client.direccion as clienteDireccion',
      ])
      .where('bano.baño_id = :toiletId', { toiletId })
      .getRawMany();

    return services;
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
      where: { estado: ResourceState.MANTENIMIENTO },
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
