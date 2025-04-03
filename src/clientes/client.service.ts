import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Cliente } from './entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    @InjectRepository(Cliente) private clientRepository: Repository<Cliente>,
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

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: Cliente[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Recuperando clientes - página: ${page}, límite: ${limit}`);

    // Validaciones básicas
    const _page = page < 1 ? 1 : page;
    const _limit = limit < 1 ? 10 : limit > 100 ? 100 : limit;

    // Calcular el skip (cuántos registros saltar)
    const skip = (_page - 1) * _limit;

    // Ejecutar consulta con paginación
    const [items, total] = await this.clientRepository.findAndCount({
      skip: skip,
      take: _limit,
      order: { clienteId: 'ASC' }, // Puedes cambiar el orden según necesites
    });

    // Calcular total de páginas
    const totalPages = Math.ceil(total / _limit);

    return {
      items,
      total,
      page: _page,
      limit: _limit,
      totalPages,
    };
  }

  async findOne(clienteId: number): Promise<Cliente> {
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
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    // Actualizar los campos del cliente
    Object.assign(client, updateClientDto);

    return this.clientRepository.save(client); // Guardar los cambios en la base de datos
  }

  async remove(clienteId: number): Promise<void> {
    this.logger.log(`Eliminando cliente con id: ${clienteId}`);
    const client = await this.clientRepository.findOne({
      where: { clienteId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    // Opción 1: Usar el ID directamente
    await this.clientRepository.delete(clienteId);

    // O Alternativa: Usar remove para entidades completas
    // await this.clientRepository.remove(client);
  }

  async search(term: string): Promise<Cliente[]> {
    this.logger.log(`Buscando clientes con término: ${term}`);

    // Si el término está vacío, devolver una lista vacía
    if (!term || term.trim() === '') {
      return [];
    }

    // Usar el QueryBuilder para hacer una búsqueda más flexible
    const clientes = await this.clientRepository
      .createQueryBuilder('cliente')
      .where('cliente.nombre LIKE :term', { term: `%${term}%` })
      .orWhere('cliente.cuit LIKE :term', { term: `%${term}%` })
      .orWhere('cliente.email LIKE :term', { term: `%${term}%` })
      .orWhere('cliente.telefono LIKE :term', { term: `%${term}%` })
      // Puedes agregar más campos según tu modelo
      .orderBy('cliente.nombre', 'ASC')
      .take(20) // Limitar resultados para evitar sobrecarga
      .getMany();

    return clientes;
  }
}
