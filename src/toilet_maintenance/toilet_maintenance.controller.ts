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

@Controller('toilet_maintenance')
@UseGuards(JwtAuthGuard)
export class ToiletMaintenanceController {
  constructor(private readonly maintenanceService: ToiletMaintenanceService) {}

  // Endpoint para crear un nuevo mantenimiento de baño o programar mantenimientos por contrato
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  async createOrSchedule(
    @Body() createMaintenanceDto: CreateToiletMaintenanceDto,
    @Query('contractId') contractId?: number, // Este parámetro es opcional y solo se usa si estamos programando mantenimientos según contrato
  ): Promise<ToiletMaintenance | ToiletMaintenance[]> {
    return this.maintenanceService.createOrScheduleMaintenance(createMaintenanceDto, contractId);
  }

  @Get()
  async findAll(): Promise<ToiletMaintenance[]> {
    return this.maintenanceService.findAll();
  }

  // Rutas con prefijos específicos deben ir ANTES que rutas con parámetros
  @Get('search')
  async search(
    @Query() filterDto: FilterToiletMaintenanceDto,
  ): Promise<ToiletMaintenance[]> {
    return this.maintenanceService.findAllWithFilters(filterDto);
  }

  @Get('stats/:toiletId')
  async getMaintenanceStats(
    @Param('toiletId', ParseIntPipe) toiletId: number,
  ): Promise<any> {
    return this.maintenanceService.getMantenimientosStats(toiletId);
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
}

