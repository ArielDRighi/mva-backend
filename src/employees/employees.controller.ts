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
  DefaultValuePipe,
} from '@nestjs/common';
import { Role } from 'src/roles/enums/role.enum';
import { EmployeesService } from './employees.service';
import { CreateFullEmployeeDto } from './dto/create_employee.dto';
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
import { UpdateContactEmergencyDto } from './dto/update_contact_emergency.dto';
import { UpdateLicenseDto } from './dto/update_license.dto';
import { CreateExamenPreocupacionalDto } from './dto/create_examen.dto';
import { UpdateExamenPreocupacionalDto } from './dto/modify_examen.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Put('examen/modify/:examenId')
  async updateExamenPreocupacional(
    @Body() updateExamenPreocupacionalDto: UpdateExamenPreocupacionalDto,
    @Param('examenId', ParseIntPipe) examenId: number,
  ): Promise<any> {
    return await this.employeesService.updateExamenPreocupacional(
      examenId,
      updateExamenPreocupacionalDto,
    );
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('examen/delete/:examenId')
  async removeExamenPreocupacional(
    @Param('examenId', ParseIntPipe) examenId: number,
  ): Promise<{ message: string }> {
    return await this.employeesService.removeExamenPreocupacional(examenId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('examen/create')
  async createExamenPreocupacional(
    @Body() createExamenPreocupacionalDto: CreateExamenPreocupacionalDto,
  ): Promise<any> {
    return await this.employeesService.createExamenPreocupacional(
      createExamenPreocupacionalDto,
    );
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('examen/:empleadoId')
  async findExamenesByEmpleadoId(
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ) {
    return await this.employeesService.findExamenesByEmpleadoId(empleadoId);
  }

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
  @Delete('emergency/delete/:contactoId')
  async removeEmergencyContact(
    @Param('contactoId', ParseIntPipe) contactoId: number,
  ): Promise<{ message: string }> {
    return await this.employeesService.removeEmergencyContact(contactoId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Put('emergency/modify/:contactoId')
  async updateEmergencyContact(
    @Body() updateEmergencyContactDto: UpdateContactEmergencyDto,
    @Param('contactoId', ParseIntPipe) contactoId: number,
  ): Promise<ContactosEmergencia> {
    return await this.employeesService.updateEmergencyContact(
      contactoId,
      updateEmergencyContactDto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Get('emergency/:empleadoId')
  async findEmergencyContactsByEmpleadoId(
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ) {
    try {
      return await this.employeesService.findEmergencyContactsByEmpleadoId(
        empleadoId,
      );
    } catch (error) {
      console.error('Error finding emergency contacts:', error);
    }
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('licencias/por-vencer')
  async findLicensesToExpire(
    @Query('dias', new DefaultValuePipe(30), ParseIntPipe) dias: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<{
    data: Licencias[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }> {
    return await this.employeesService.findLicensesToExpire(dias, page, limit);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Put('licencia/update/:empleadoId')
  async updateLicencia(
    @Body() updateLicenseDto: UpdateLicenseDto,
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ): Promise<Licencias> {
    return await this.employeesService.updateLicencia(
      empleadoId,
      updateLicenseDto,
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Delete('licencia/delete/:licenciaId')
  async removeLicencia(
    @Param('licenciaId', ParseIntPipe) licenciaId: number,
  ): Promise<{ message: string }> {
    return await this.employeesService.removeLicencia(licenciaId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Post('licencia/:empleadoId')
  async createLicencia(
    @Body() createEmployeeDto: CreateLicenseDto,
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ): Promise<Licencias> {
    console.log('Empleado ID:', empleadoId);
    console.log('Create License DTO:', createEmployeeDto);
    return await this.employeesService.createLicencia(
      createEmployeeDto,    empleadoId,
    );
  }
  
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Get('licencia/:empleadoId')
  async findLicenciasByEmpleadoId(
    @Param('empleadoId', ParseIntPipe) empleadoId: number,
  ): Promise<Licencias> {
    return await this.employeesService.findLicenciasByEmpleadoId(empleadoId);
  }
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':id/proximos-servicios')
  async obtenerProximosServicios(@Param('id', ParseIntPipe) id: number) {
    return await this.employeesService.findProximosServiciosPorEmpleadoId(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Get('licencias')
  async findLicencias(
    @Query('dias', new DefaultValuePipe(0), ParseIntPipe) dias: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<{
    data: Licencias[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
  }> {
    return await this.employeesService.findLicencias(dias, page, limit, search);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  async create(
    @Body() createEmployeeDto: CreateFullEmployeeDto,
  ): Promise<Empleado> {
    return this.employeesService.create(createEmployeeDto);
  }

  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<any> {
    return this.employeesService.findAll(paginationDto);
  }

  @Get('total_employees')
  async getTotalEmployees(): Promise<{
    total: number;
    totalDisponibles: number;
    totalInactivos: number;
  }> {
    return this.employeesService.getTotalEmployees();
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
