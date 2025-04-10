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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { FilterServicesDto } from './dto/filter-services.dto';
import { Service } from './entities/service.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { Role } from '../roles/enums/role.enum';
import { ServiceState } from '../common/enums/resource-states.enum';

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  findAll(@Query() filterDto: FilterServicesDto): Promise<Service[]> {
    return this.servicesService.findAll(filterDto);
  }

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
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: ServiceState,
  ): Promise<Service> {
    return this.servicesService.changeStatus(id, estado);
  }
}
