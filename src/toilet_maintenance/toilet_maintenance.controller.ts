import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ToiletMaintenanceService } from './toilet_maintenance.service';
import { CreateToiletMaintenanceDto } from './dto/create_toilet_maintenance.dto';
import { UpdateToiletMaintenanceDto } from './dto/update_toilet_maintenance.dto';
import { FilterToiletMaintenanceDto } from './dto/filter_toilet_maintenance.dto';
import { ToiletMaintenance } from './entities/toilet_maintenance.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('toilet_maintenance')
@UseGuards(JwtAuthGuard)
export class ToiletMaintenanceController {
  constructor(private readonly maintenanceService: ToiletMaintenanceService) {}

  // Endpoint para crear un nuevo mantenimiento de baño
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  async create(
    @Body() createMaintenanceDto: CreateToiletMaintenanceDto,
  ): Promise<ToiletMaintenance> {
    return this.maintenanceService.create(createMaintenanceDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<{
    data: ToiletMaintenance[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.maintenanceService.findAll(paginationDto);
  }

  @Get('stats/:toiletId')
  async getMaintenanceStats(
    @Param('toiletId', ParseIntPipe) toiletId: number,
  ): Promise<any> {
    return this.maintenanceService.getMantenimientosStats(toiletId);
  }

  @Get('proximos')
  async getUpcomingMaintenances() {
    return this.maintenanceService.getUpcomingMaintenances();
  }

  // Esta ruta con parámetro debe ir DESPUÉS de las específicas
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) maintenanceId: number,
  ): Promise<ToiletMaintenance> {
    return this.maintenanceService.findById(maintenanceId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) maintenanceId: number,
    @Body() updateMaintenanceDto: UpdateToiletMaintenanceDto,
  ): Promise<ToiletMaintenance> {
    return this.maintenanceService.update(maintenanceId, updateMaintenanceDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) maintenanceId: number,
  ): Promise<void> {
    return this.maintenanceService.delete(maintenanceId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Patch(':id/complete')
  async completeMaintenace(
    @Param('id', ParseIntPipe) maintenanceId: number,
  ): Promise<ToiletMaintenance> {
    return this.maintenanceService.completeMaintenace(maintenanceId);
  }
}
