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
  Query,
} from '@nestjs/common';
import { ClientService } from './clients.service';
import { CreateClientDto } from './dto/create_client.dto';
import { UpdateClientDto } from './dto/update_client.dto';
import { Cliente } from './entities/client.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Pagination } from 'src/common/interfaces/paginations.interface';

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
  async findAll(
    @Query() paginationDto: PaginationDto, // Recibe los parámetros de paginación
  ): Promise<Pagination<Cliente>> {
    // Devuelve la paginación completa de los clientes
    return this.clientService.findAll(paginationDto);
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

  @Get(':id/active-contract')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async getActiveContract(@Param('id', ParseIntPipe) clientId: number) {
    return this.clientService.getActiveContract(clientId);
  }
}
