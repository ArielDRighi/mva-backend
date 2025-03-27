import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Cliente } from './entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Cliente)private clientRepository: Repository<Cliente>
  ) {}
  async create(createClientDto: CreateClientDto): Promise<Cliente> {
    const client = this.clientRepository.create(createClientDto);  // Crea una nueva instancia de Client

    return this.clientRepository.save(client);  // Guarda el cliente en la base de datos
  }

  async findAll(): Promise<Cliente[]> {
    return this.clientRepository.find();  // Recupera todos los clientes
  }

  async findOneClient(clienteId: number): Promise<Cliente> {
    const client = await this.clientRepository.findOne({
      where: { clienteId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    return client;
  }

  async updateClient(clienteId: number, updateClientDto: UpdateClientDto): Promise<Cliente> {
    const client = await this.clientRepository.findOne({
      where: { clienteId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    // Actualizar los campos del cliente
    Object.assign(client, updateClientDto);

    return this.clientRepository.save(client);  // Guardar los cambios en la base de datos
  }

  async deleteClient(clienteId: number): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { clienteId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clienteId} not found`);
    }

    await this.clientRepository.delete(client);  // Eliminar el cliente de la base de datos
  }
}
