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
  BadRequestException,
  HttpException,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import {
  ServiceState,
  ServiceType,
} from '../common/enums/resource-states.enum';
import { ChangeServiceStatusDto } from './dto/change-service-status.dto';

import { MailerInterceptor } from 'src/mailer/interceptor/mailer.interceptor';
import { FilterServicesDto } from './dto/filter-service.dto';

// Añadimos el ClassSerializerInterceptor para aplicar las transformaciones
@UseInterceptors(MailerInterceptor, ClassSerializerInterceptor)
@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('capacitacion')
  async getCapacitacionServices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.servicesService.getCapacitacionServices(page, limit, search);
  }

  @Get('instalacion')
  async getInstalacionServices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const ret = this.servicesService.getInstalacionServices(page, limit);
    console.log('ret', ret);
    return ret;
  }

  @Get('generico')
  async getLimpiezaServices(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.servicesService.getLimpiezaServices(page, limit);
  }

  @Get('employee/:employeeId/last')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  async getLastServicesByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {
    return this.servicesService.getLastServices(employeeId);
  }

  @Get('employee/:employeeId/completed')
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  async getCompletedServicesByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<any> {
    try {
      const paginationDto = { page, limit, search };
      return this.servicesService.getCompletedServices(
        employeeId,
        paginationDto,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        `Error al obtener los servicios completados: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('proximos')
  async getProximosServicios() {
    return this.servicesService.getProximosServicios();
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post('instalacion')
  createInstalacion(@Body() dto: CreateServiceDto): Promise<Service> {
    dto.tipoServicio = ServiceType.INSTALACION;
    return this.servicesService.create(dto);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post('capacitacion')
  createCapacitacion(@Body() dto: CreateServiceDto): Promise<Service> {
    dto.tipoServicio = ServiceType.CAPACITACION;
    return this.servicesService.create(dto);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post('limpieza')
  createLimpieza(@Body() dto: CreateServiceDto): Promise<Service> {
    dto.tipoServicio = ServiceType.LIMPIEZA;
    return this.servicesService.create(dto);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post('generico')
  create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(createServiceDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERARIO, Role.SUPERVISOR)
  @Get('/assigned/pendings/:employeeId')
  async getAssignedPendings(@Param('employeeId') employeeId: number) {
    console.log('employeeId', employeeId);
    return this.servicesService.getAssignedPendings(employeeId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.OPERARIO, Role.SUPERVISOR)
  @Get('/assigned/inProgress/:employeeId')
  async getAssignedInProgress(@Param('employeeId') employeeId: number) {
    console.log('employeeId', employeeId);
    return this.servicesService.getAssignedInProgress(employeeId);
  }

  @Get()
  async findAll(
    @Query() filterDto: FilterServicesDto, // Recibe los filtros como parámetros de consulta
    @Query('page') page: number = 1, // Recibe el número de página desde los parámetros de consulta
    @Query('limit') limit: number = 10, // Recibe el límite de registros por página desde los parámetros de consulta
  ): Promise<any> {
    try {
      // Llama al servicio con los filtros, página y límite
      return await this.servicesService.findAll(filterDto, page, limit);
    } catch (error: unknown) {
      // Manejo de errores
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        `Error al obtener los servicios: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('stats')
  async getServicesStats(): Promise<{
    totalInstalacion: number;
    totalLimpieza: number;
    totalRetiro: number;
    total: number;
  }> {
    return this.servicesService.getStats();
  }

  @Get('resumen')
  async getResumenServicios() {
    return this.servicesService.getResumenServicios();
  }

  // Agrega estas rutas específicas antes de la ruta con parámetro :id
  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Service[]> {
    return this.servicesService.findByDateRange(startDate, endDate);
  }
  // services.controller.ts
  @Get('semana-restante')
  async getRemainingWeekServices() {
    return this.servicesService.getRemainingWeekServices();
  }

  @Get('today')
  findToday(): Promise<Service[]> {
    return this.servicesService.findToday();
  }

  @Get('pending')
  findPending(): Promise<Service[]> {
    return this.servicesService.findByStatus(ServiceState.SUSPENDIDO);
  }

  @Get('in-progress')
  findInProgress(): Promise<Service[]> {
    return this.servicesService.findByStatus(ServiceState.EN_PROGRESO);
  }

  // Esta ruta debe ir después de las rutas específicas
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Service> {
    return this.servicesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.servicesService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Patch(':id/estado')
  async changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: ChangeServiceStatusDto,
  ): Promise<Service> {
    // Validar que el estado es válido
    if (!Object.values(ServiceState).includes(statusDto.estado)) {
      throw new BadRequestException(`Estado inválido: ${statusDto.estado}`);
    }

    // Validar que si el estado es INCOMPLETO, se proporcione un comentario
    if (
      statusDto.estado === ServiceState.INCOMPLETO &&
      !statusDto.comentarioIncompleto
    ) {
      throw new BadRequestException(
        'Para cambiar un servicio a estado INCOMPLETO, debe proporcionar un comentario explicando el motivo',
      );
    }

    return this.servicesService.changeStatus(
      id,
      statusDto.estado,
      statusDto.comentarioIncompleto,
    );
  }
}
