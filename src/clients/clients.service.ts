import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create_client.dto';
import { UpdateClientDto } from './dto/update_client.dto';
import { Cliente } from './entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, QueryFailedError } from 'typeorm';
import { ChemicalToiletsService } from '../chemical_toilets/chemical_toilets.service';
import {
  CondicionesContractuales,
  EstadoContrato,
} from '../contractual_conditions/entities/contractual_conditions.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Pagination } from 'src/common/interfaces/paginations.interface';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    @InjectRepository(Cliente) private clientRepository: Repository<Cliente>,
    @InjectRepository(CondicionesContractuales)
    private condicionesContractualesRepository: Repository<CondicionesContractuales>,
    private chemicalToiletsService: ChemicalToiletsService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Cliente> {
    this.logger.log(`Creando cliente: ${createClientDto.nombre}`);
    // Verificar si ya existe un cliente con el mismo CUIT
    const existingClient = await this.clientRepository.findOne({
      where: { cuit: createClientDto.cuit },
    });

    if (existingClient) {
      throw new ConflictException(
        `Ya existe un cliente con el CUIT ${createClientDto.cuit}`,
      );
    }

    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }

  async findAll(paginationDto: PaginationDto): Promise<Pagination<Cliente>> {
    const { page = 1, limit = 10, search } = paginationDto;

    this.logger.log(
      `Recuperando clientes - Página: ${page}, Límite: ${limit}, Búsqueda: ${search}`,
    );

    const query = this.clientRepository.createQueryBuilder('cliente');

    if (search) {
      const searchTerms = search.toLowerCase().split(' ');

      // Usar primera palabra con WHERE
      query.where(
        `LOWER(UNACCENT(cliente.nombre)) LIKE :term
        OR LOWER(UNACCENT(cliente.cuit)) LIKE :term
        OR LOWER(UNACCENT(cliente.email)) LIKE :term
        OR LOWER(UNACCENT(cliente.estado)) LIKE :term
        OR LOWER(UNACCENT(cliente.direccion)) LIKE :term
        OR LOWER(UNACCENT(cliente.contacto_principal)) LIKE :term`,
        { term: `%${searchTerms[0]}%` },
      );

      // Palabras adicionales con AND
      for (let i = 1; i < searchTerms.length; i++) {
        query.andWhere(
          `LOWER(UNACCENT(cliente.nombre)) LIKE :term${i}
          OR LOWER(UNACCENT(cliente.cuit)) LIKE :term${i}
          OR LOWER(UNACCENT(cliente.email)) LIKE :term${i}
          OR LOWER(UNACCENT(cliente.estado)) LIKE :term${i}
          OR LOWER(UNACCENT(cliente.direccion)) LIKE :term${i}
          OR LOWER(UNACCENT(cliente.contacto_principal)) LIKE :term${i}`,
          { [`term${i}`]: `%${searchTerms[i]}%` },
        );
      }
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  //Desde el Front esta es la forma de obtener el GETall
  //GET /clientes?limit=10&page=1&nombre=juan&email=gmail

  async findOneClient(clienteId: number): Promise<Cliente> {
    this.logger.log(`Buscando cliente con id: ${clienteId}`);
    const client = await this.clientRepository.findOne({
      where: { clienteId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    return client;
  }

  async updateClient(
  clienteId: number,
  updateClientDto: UpdateClientDto,
): Promise<Cliente> {
  this.logger.log(`Actualizando cliente con id: ${clienteId}`);
  const client = await this.clientRepository.findOne({
    where: { clienteId },
  });

  if (!client) {
    throw new NotFoundException(`El cliente con id ${clienteId} no se encuentra`);
  }

  // Actualizar campos
  Object.assign(client, updateClientDto);

  try {
    return await this.clientRepository.save(client);
  } catch (error) {
    // Manejar error de duplicado de cuit
    if (
      error instanceof QueryFailedError &&
      error.driverError?.code === '23505' &&
      error.driverError.detail?.includes('cuit')
    ) {
      throw new ConflictException('El CUIT ya está registrado para otro cliente.');
    }
    // Si es otro error, volver a lanzarlo
    throw error;
  }
}

  async deleteClient(clienteId: number): Promise<void> {
    this.logger.log(`Eliminando cliente con id: ${clienteId}`);
    const client = await this.clientRepository.findOne({
      where: { clienteId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    try {
      await this.clientRepository.delete(clienteId);
    } catch (error) {
      // Si el error viene de una violación de clave foránea
      if (
        error instanceof QueryFailedError &&
        (error as any).code === '23503'
      ) {
        throw new ConflictException(
          `No se puede eliminar el cliente con ID ${clienteId} porque tiene servicios asociados.`,
        );
      }

      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async getActiveContract(clientId: number) {
    const client = await this.findOneClient(clientId);

    const contratos = await this.condicionesContractualesRepository.find({
      where: {
        cliente: { clienteId: clientId },
        estado: EstadoContrato.ACTIVO,
        fecha_fin: MoreThan(new Date()),
      },
      order: { fecha_fin: 'DESC' },
    });

    if (!contratos || contratos.length === 0) {
      throw new NotFoundException(
        `No hay contratos activos para el cliente ${client.nombre}`,
      );
    }

    return {
      contrato: contratos[0],
      banosAsignados:
        await this.chemicalToiletsService.findByClientId(clientId),
    };
  }
}
