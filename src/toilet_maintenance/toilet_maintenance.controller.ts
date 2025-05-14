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
  DefaultValuePipe,
  BadRequestException,
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
import { Pagination } from 'src/common/interfaces/paginations.interface';

@Controller('toilet_maintenance')
@UseGuards(JwtAuthGuard)
export class ToiletMaintenanceController {
  constructor(private readonly maintenanceService: ToiletMaintenanceService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  async create(
    @Body() createMaintenanceDto: CreateToiletMaintenanceDto,
  ): Promise<ToiletMaintenance> {
    return this.maintenanceService.create(createMaintenanceDto);
  }
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ): Promise<Pagination<ToiletMaintenance>> {
    if (page < 1) {
      throw new BadRequestException(
        'El parámetro "page" debe ser un número entero positivo',
      );
    }
    if (limit < 1) {
      throw new BadRequestException(
        'El parámetro "limit" debe ser un número entero positivo',
      );
    }

    return this.maintenanceService.findAll(page, limit);
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

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Patch(':id/complete')
  async completeMaintenace(
    @Param('id', ParseIntPipe) maintenanceId: number,
  ): Promise<ToiletMaintenance> {
    return this.maintenanceService.completeMaintenace(maintenanceId);
  }
}
