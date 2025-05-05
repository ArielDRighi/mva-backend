import { Role } from 'src/roles/enums/role.enum';
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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create_employee.dto';
import { UpdateEmployeeDto } from './dto/update_employee.dto';
import { Empleado } from './entities/employee.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/guards/roles.guard';
import { Roles } from '../roles/decorators/roles.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateLicenseDto } from './dto/create_license.dto';
import { Licencias } from './entities/license.entity';
import { CreateContactEmergencyDto } from './dto/create_contact_emergency.dto';
import { ContactosEmergencia } from './entities/emergencyContacts.entity';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Post('emergency/:empleadoId')
  async createEmergencyContact(
    @Body() createEmergencyContactDto: CreateContactEmergencyDto,
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ): Promise<ContactosEmergencia> {
    return await this.employeesService.createEmergencyContact(
      createEmergencyContactDto,
      empleadoId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Get('emergency/:empleadoId')
  async findEmergencyContactsByEmpleadoId(
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ): Promise<Empleado> {
    return await this.employeesService.findEmergencyContactsByEmpleadoId(
      empleadoId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Post('licencia/:empleadoId')
  async createLicencia(
    @Body() createEmployeeDto: CreateLicenseDto,
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ): Promise<Licencias> {
    return await this.employeesService.createLicencia(
      createEmployeeDto,
      empleadoId,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Get('licencia/:empleadoId')
  async findLicenciasByEmpleadoId(
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ): Promise<Empleado> {
    return await this.employeesService.findLicenciasByEmpleadoId(empleadoId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Get('licencias')
  async findLicencias(): Promise<Licencias[]> {
    return await this.employeesService.findLicencias();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<Empleado> {
    return this.employeesService.create(createEmployeeDto);
  }
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<any> {
    return this.employeesService.findAll(paginationDto);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Empleado> {
    return this.employeesService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get('documento/:documento')
  findByDocumento(@Param('documento') documento: string): Promise<Empleado> {
    return this.employeesService.findByDocumento(documento);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Empleado> {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.employeesService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Patch(':id/estado')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ): Promise<Empleado> {
    return this.employeesService.changeStatus(id, estado);
  }
}
