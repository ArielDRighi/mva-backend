import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './clients.service';
import { CreateClientDto } from './dto/create_client.dto';
import { UpdateClientDto } from './dto/update_client.dto';
import { Cliente } from './entities/client.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';

@Controller('clients')
@UseGuards(JwtAuthGuard) // Protege todos los endpoints del controlador
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR) // Solo admin y supervisor pueden crear
  @Post()
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  async findAll(): Promise<Cliente[]> {
    return this.clientService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) clienteId: number,
  ): Promise<Cliente> {
    return this.clientService.findOneClient(clienteId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR) // Solo admin y supervisor pueden actualizar
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) clienteId: number,
    @Body() updateClientDto: UpdateClientDto,
  ): Promise<Cliente> {
    return this.clientService.updateClient(clienteId, updateClientDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN) // Solo admin puede eliminar
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) clienteId: number): Promise<void> {
    return this.clientService.deleteClient(clienteId);
  }
}
