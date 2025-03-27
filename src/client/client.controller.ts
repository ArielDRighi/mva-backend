import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  async findAll(): Promise<Client[]> {
    return this.clientService.findAll();
  }

  @Get(':id')  // El parámetro :id será el clientId
  async findOne(@Param('id') clientId: number): Promise<Client> {
    return this.clientService.findOneClient(clientId);
  }

  @Put(':id')  // El parámetro :id será el clientId
  async update(
    @Param('id') clientId: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Client> {
    return this.clientService.updateClient(clientId, updateClientDto);
  }

  @Delete(':id')
  async delete(@Param('id') clientId: number): Promise<void> {
    return this.clientService.deleteClient(clientId);
  }
}
