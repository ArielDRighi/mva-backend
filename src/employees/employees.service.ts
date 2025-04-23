import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empleado } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create_employee.dto';
import { UpdateEmployeeDto } from './dto/update_employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Empleado)
    private employeeRepository: Repository<Empleado>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Empleado> {
    this.logger.log(
      `Creando empleado: ${createEmployeeDto.nombre} ${createEmployeeDto.apellido}`,
    );

    // Verificar si ya existe un empleado con el mismo documento
    const existingDocumento = await this.employeeRepository.findOne({
      where: { documento: createEmployeeDto.documento },
    });

    if (existingDocumento) {
      throw new ConflictException(
        `Ya existe un empleado con el documento ${createEmployeeDto.documento}`,
      );
    }

    // Verificar si ya existe un empleado con el mismo email
    const existingEmail = await this.employeeRepository.findOne({
      where: { email: createEmployeeDto.email },
    });

    if (existingEmail) {
      throw new ConflictException(
        `Ya existe un empleado con el email ${createEmployeeDto.email}`,
      );
    }

    const employee = this.employeeRepository.create(createEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async findAll(page: number = 1, limit: number = 10): Promise<any> {
    this.logger.log('Recuperando todos los empleados');
    
    // Validamos que los parámetros sean válidos
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be greater than 0');
    }
  
    const [empleados, total] = await this.employeeRepository.findAndCount({
      skip: (page - 1) * limit, // Calculamos el salto (offset) para la paginación
      take: limit, // Número de registros a devolver por página
    });
  
    return {
      data: empleados,
      totalItems: total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }
  

  async findOne(id: number): Promise<Empleado> {
    this.logger.log(`Buscando empleado con id: ${id}`);
    const employee = await this.employeeRepository.findOne({
      where: { id },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado con id ${id} no encontrado`);
    }

    return employee;
  }

  async findByDocumento(documento: string): Promise<Empleado> {
    this.logger.log(`Buscando empleado con documento: ${documento}`);
    const employee = await this.employeeRepository.findOne({
      where: { documento },
    });

    if (!employee) {
      throw new NotFoundException(
        `Empleado con documento ${documento} no encontrado`,
      );
    }

    return employee;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Empleado> {
    this.logger.log(`Actualizando empleado con id: ${id}`);
    const employee = await this.findOne(id);

    // Verificar si el documento se está actualizando y si ya existe
    if (
      updateEmployeeDto.documento &&
      updateEmployeeDto.documento !== employee.documento
    ) {
      const existingDocumento = await this.employeeRepository.findOne({
        where: { documento: updateEmployeeDto.documento },
      });

      if (existingDocumento) {
        throw new ConflictException(
          `Ya existe un empleado con el documento ${updateEmployeeDto.documento}`,
        );
      }
    }

    // Verificar si el email se está actualizando y si ya existe
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmail = await this.employeeRepository.findOne({
        where: { email: updateEmployeeDto.email },
      });

      if (existingEmail) {
        throw new ConflictException(
          `Ya existe un empleado con el email ${updateEmployeeDto.email}`,
        );
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return this.employeeRepository.save(employee);
  }

  async remove(id: number): Promise<{ message: string }> {
    this.logger.log(`Eliminando empleado con id: ${id}`);
    const employee = await this.findOne(id);
    const nombre = `${employee.nombre} ${employee.apellido}`;
    await this.employeeRepository.remove(employee);
    return { message: `Empleado ${nombre} eliminado correctamente` };
  }

  async changeStatus(id: number, estado: string): Promise<Empleado> {
    this.logger.log(`Cambiando estado del empleado ${id} a ${estado}`);
    const employee = await this.findOne(id);
    employee.estado = estado;
    return this.employeeRepository.save(employee);
  }

  async findByCargo(cargo: string): Promise<Empleado[]> {
    this.logger.log(`Buscando empleados con cargo: ${cargo}`);
    return this.employeeRepository.find({
      where: { cargo },
    });
  }
}
