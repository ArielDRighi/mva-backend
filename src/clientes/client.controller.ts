import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Cliente } from './entities/client.entity';

@Controller('clientes')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  async findAll(): Promise<Cliente[]> {
    return this.clientService.findAll();
  }

  @Get(':id') // El parámetro :id será el clientId
  async findOne(
    @Param('id', ParseIntPipe) clienteId: number,
  ): Promise<Cliente> {
    return this.clientService.findOneClient(clienteId);
  }

  @Put(':id') // El parámetro :id será el clientId
  async update(
    @Param('id', ParseIntPipe) clienteId: number, // ✅ CORRECTO: con ParseIntPipe
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Cliente> {
    return this.clientService.updateClient(clienteId, updateClientDto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) clienteId: number): Promise<void> {
    // ✅ CORRECTO
    return this.clientService.deleteClient(clienteId);
  }
}
