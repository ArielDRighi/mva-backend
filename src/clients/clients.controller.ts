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
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
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
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<{
    items: Cliente[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.clientService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) clienteId: number,
  ): Promise<Cliente> {
    return this.clientService.findOne(clienteId);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) clienteId: number): Promise<void> {
    return this.clientService.remove(clienteId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('search')
  async search(@Query('term') term: string): Promise<Cliente[]> {
    return this.clientService.search(term);
  }
}
