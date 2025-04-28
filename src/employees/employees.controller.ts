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
import { Role } from '../roles/enums/role.enum';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Empleado> {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  async findAll(
    @Query('cargo') cargo?: string,      // Filtro opcional por cargo
    @Query('page') page: number = 1,     // Número de página (por defecto 1)
    @Query('limit') limit: number = 10,  // Límite de registros por página (por defecto 10)
  ): Promise<any> {
    if (cargo) {
      // Si se pasa un cargo, filtramos por cargo
      return this.employeesService.findByCargo(cargo);
    }
    
    // Si no se pasa cargo, obtenemos todos los empleados con paginación
    return this.employeesService.findAll(page, limit);
  }
  

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Empleado> {
    return this.employeesService.findOne(id);
  }

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
