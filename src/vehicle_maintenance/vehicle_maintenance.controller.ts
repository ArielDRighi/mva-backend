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
import { VehicleMaintenanceService } from './vehicle_maintenance.service';
import { CreateMaintenanceDto } from './dto/create_maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update_maintenance.dto';
import { VehicleMaintenanceRecord } from './entities/vehicle_maintenance_record.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('vehicle_maintenance')
@UseGuards(JwtAuthGuard)
export class VehicleMaintenanceController {
  constructor(private readonly maintenanceService: VehicleMaintenanceService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  create(
    @Body() createMaintenanceDto: CreateMaintenanceDto,
  ): Promise<VehicleMaintenanceRecord> {
    return this.maintenanceService.create(createMaintenanceDto);
  }

@Get()
async findAll(
  @Query('page') page = '1',
  @Query('limit') limit = '10',
  @Query('search') search?: string,
) {
  const paginationDto = {
    page: Number(page),
    limit: Number(limit),
  };

  return this.maintenanceService.findAll(paginationDto, search);
}


  @Get('upcoming')
  findUpcoming(): Promise<VehicleMaintenanceRecord[]> {
    return this.maintenanceService.findUpcomingMaintenances();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VehicleMaintenanceRecord> {
    return this.maintenanceService.findOne(id);
  }

  @Get('vehiculo/:id')
  findByVehicle(
    @Param('id', ParseIntPipe) vehiculoId: number,
  ): Promise<VehicleMaintenanceRecord[]> {
    return this.maintenanceService.findByVehicle(vehiculoId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<VehicleMaintenanceRecord> {
    return this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.maintenanceService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Patch(':id/complete')
  completeMaintenace(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<VehicleMaintenanceRecord> {
    return this.maintenanceService.completeMaintenace(id);
  }
}
