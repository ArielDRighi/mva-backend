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

  async findAll(): Promise<Cliente[]> {
    this.logger.log('Recuperando todos los clientes');
    return this.clientRepository.find(); // Recupera todos los clientes
  }

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
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    // Actualizar los campos del cliente
    Object.assign(client, updateClientDto);

    return this.clientRepository.save(client); // Guardar los cambios en la base de datos
  }

  async deleteClient(clienteId: number): Promise<void> {
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
}
