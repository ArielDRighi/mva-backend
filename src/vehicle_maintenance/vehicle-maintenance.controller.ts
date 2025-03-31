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
import { VehicleMaintenanceService } from './vehicle-maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { VehicleMaintenanceRecord } from './entities/vehicle-maintenance-record.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';

@Controller('vehicle-maintenance')
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
  findAll(): Promise<VehicleMaintenanceRecord[]> {
    return this.maintenanceService.findAll();
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
}
