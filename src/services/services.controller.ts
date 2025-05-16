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
import { ServiceState } from '../common/enums/resource-states.enum';
import { ChangeServiceStatusDto } from './dto/change-service-status.dto';

import { MailerInterceptor } from 'src/mailer/interceptor/mailer.interceptor';
import { FilterServicesDto } from './dto/filter-service.dto';

// Añadimos el ClassSerializerInterceptor para aplicar las transformaciones
@UseInterceptors(MailerInterceptor, ClassSerializerInterceptor)
@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post('create/automatic')
  createWithAutomaticAssignment(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    createServiceDto.asignacionAutomatica = true;
    return this.servicesService.create(createServiceDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post('create/manual')
  createWithManualAssignment(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<Service> {
    createServiceDto.asignacionAutomatica = false;

    if (
      !createServiceDto.asignacionesManual ||
      createServiceDto.asignacionesManual.length === 0
    ) {
      throw new BadRequestException(
        'Para la asignación manual se requiere proporcionar al menos una asignación',
      );
    }

    return this.servicesService.create(createServiceDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    console.warn(
      'La ruta POST /services está obsoleta. Usar /services/automatic o /services/manual',
    );
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  async findAll(@Query() filterDto: FilterServicesDto): Promise<any> {
    try {
      // Use default values if not provided
      const page = filterDto.page || 1;
      const limit = filterDto.limit || 10;

      // Validate values are positive
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

      // Call service with filters, page, and limit
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

  // Agrega estas rutas específicas antes de la ruta con parámetro :id
  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Service[]> {
    return this.servicesService.findByDateRange(startDate, endDate);
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
