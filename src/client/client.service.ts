import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(Client)private clientRepository: Repository<Client>
  ) {}
  async create(createClientDto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create(createClientDto);  // Crea una nueva instancia de Client

    return this.clientRepository.save(client);  // Guarda el cliente en la base de datos
  }

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find();  // Recupera todos los clientes
  }

  async findOneClient(clientId: number): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }

    return client;
  }

  async updateClient(clientId: number, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }

    // Actualizar los campos del cliente
    Object.assign(client, updateClientDto);

    return this.clientRepository.save(client);  // Guardar los cambios en la base de datos
  }

  async deleteClient(clientId: number): Promise<void> {
    const client = await this.clientRepository.findOne({
      where: { clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client with id ${clientId} not found`);
    }

    await this.clientRepository.delete(client);  // Eliminar el cliente de la base de datos
  }
}
