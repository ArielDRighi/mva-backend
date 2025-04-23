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
  Patch,
  Query,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create_vehicle.dto';
import { UpdateVehicleDto } from './dto/update_vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import { ResourceState } from '../common/enums/resource-states.enum';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  create(@Body() createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  async findAll(
    @Query('estado') estado?: string,  // Filtro por estado (opcional)
    @Query('page') page: number = 1,   // Página actual (por defecto 1)
    @Query('limit') limit: number = 10  // Límite de registros por página (por defecto 10)
  ): Promise<any> {
    if (estado) {
      // Si el estado es proporcionado, filtramos por estado
      return this.vehiclesService.findByEstado(estado as ResourceState);
    }
  
    // Si no hay filtro de estado, aplicamos la paginación normal
    return this.vehiclesService.findAll(page, limit);
  }
  

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Vehicle> {
    return this.vehiclesService.findOne(id);
  }

  @Get('placa/:placa')
  findByPlaca(@Param('placa') placa: string): Promise<Vehicle> {
    return this.vehiclesService.findByPlaca(placa);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.vehiclesService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Patch(':id/estado')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ): Promise<Vehicle> {
    return this.vehiclesService.changeStatus(id, estado);
  }
}
