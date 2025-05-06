import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { EmployeeLeave } from './entities/employee-leave.entity';
import { CreateEmployeeLeaveDto } from './dto/create-employee-leave.dto';
import { UpdateEmployeeLeaveDto } from './dto/update-employee-leave.dto';
import { EmployeesService } from '../employees/employees.service';

@Injectable()
export class EmployeeLeavesService {
  private readonly logger = new Logger(EmployeeLeavesService.name);

  constructor(
    @InjectRepository(EmployeeLeave)
    private leaveRepository: Repository<EmployeeLeave>,
    private employeesService: EmployeesService,
  ) {}

  async create(createLeaveDto: CreateEmployeeLeaveDto): Promise<EmployeeLeave> {
    this.logger.log(
      `Creando licencia para empleado: ${createLeaveDto && createLeaveDto.employeeId ? Number(createLeaveDto.employeeId) : 'unknown'}`,
    );

    // Verificar que el empleado existe
    const employeeId = Number(createLeaveDto.employeeId);
    const employee = await this.employeesService.findOne(employeeId);

    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID ${employeeId} no encontrado`,
      );
    }

    const fechaInicio = createLeaveDto.fechaInicio;
    const fechaFin = createLeaveDto.fechaFin;

    if (fechaFin < fechaInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    // Verificar si hay solapamiento con otras licencias
    const existingLeave = await this.leaveRepository.findOne({
      where: [
        {
          employeeId: employeeId, // Using the already converted employeeId
          fechaInicio: LessThanOrEqual(fechaFin),
          fechaFin: MoreThanOrEqual(fechaInicio),
        },
      ],
    });

    if (existingLeave) {
      throw new BadRequestException(
        `El empleado ya tiene una licencia programada que se solapa con las fechas solicitadas`,
      );
    }

    const leave = this.leaveRepository.create({
      ...createLeaveDto,
      employeeId, // Use the converted numeric employeeId
    } as Partial<EmployeeLeave>);
    return this.leaveRepository.save(leave);
  }

  async findAll(): Promise<EmployeeLeave[]> {
    return this.leaveRepository.find({
      relations: ['employee'],
      order: { fechaInicio: 'ASC' },
    });
  }

  async findOne(id: number): Promise<EmployeeLeave> {
    const leave = await this.leaveRepository.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!leave) {
      throw new NotFoundException(`Licencia con ID ${id} no encontrada`);
    }

    return leave;
  }

  async findByEmployee(employeeId: number): Promise<EmployeeLeave[]> {
    // Verificar que el empleado existe
    await this.employeesService.findOne(employeeId);

    return this.leaveRepository.find({
      where: { employeeId },
      relations: ['employee'],
      order: { fechaInicio: 'ASC' },
    });
  }

  async update(
    id: number,
    updateLeaveDto: UpdateEmployeeLeaveDto,
  ): Promise<EmployeeLeave> {
    const leave = await this.findOne(id);

    // Si se está cambiando el empleado, verificar que existe
    if (
      updateLeaveDto.employeeId &&
      updateLeaveDto.employeeId !== leave.employeeId
    ) {
      await this.employeesService.findOne(updateLeaveDto.employeeId);
    }

    // Si se modifican las fechas, verificar que no haya solapamiento
    if (
      (updateLeaveDto.fechaInicio &&
        leave.fechaInicio !== updateLeaveDto.fechaInicio) ||
      (updateLeaveDto.fechaFin && leave.fechaFin !== updateLeaveDto.fechaFin)
    ) {
      const employee = await this.employeesService.findOne(
        updateLeaveDto.employeeId || leave.employeeId,
      );
      if (!employee) {
        throw new NotFoundException(
          `Empleado con ID ${updateLeaveDto.employeeId} no encontrado`,
        );
      }
      const fechaInicio = updateLeaveDto.fechaInicio || leave.fechaInicio;
      const fechaFin = updateLeaveDto.fechaFin || leave.fechaFin;
      const diasUsados = fechaFin.getTime() - fechaInicio.getTime();
      const diasUsadosEnLicencia = Math.ceil(diasUsados / (1000 * 3600 * 24));
      const diasDisponibles = employee.diasVacacionesRestantes;
      if (diasUsadosEnLicencia > diasDisponibles) {
        throw new BadRequestException(
          `El empleado no tiene suficientes días de licencia disponibles`,
        );
      }

      const diasRestantes = diasDisponibles - diasUsadosEnLicencia;
      console.log('Dias restantes: ', diasRestantes);
      console.log('Dias usados en licencia: ', diasUsadosEnLicencia);

      await this.employeesService.update(employee.id, {
        diasVacacionesRestantes: diasRestantes,
        diasVacacionesUsados:
          employee.diasVacacionesUsados + diasUsadosEnLicencia,
      });

      if (fechaFin < fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio',
        );
      }

      const existingLeave = await this.leaveRepository.findOne({
        where: [
          {
            id: Not(id), // Excluir la licencia actual
            employeeId: updateLeaveDto.employeeId || leave.employeeId,
            fechaInicio: LessThanOrEqual(fechaFin),
            fechaFin: MoreThanOrEqual(fechaInicio),
          },
        ],
      });

      if (existingLeave) {
        throw new BadRequestException(
          'Las nuevas fechas se solapan con otra licencia existente',
        );
      }
    }

    Object.assign(leave, updateLeaveDto);
    return this.leaveRepository.save(leave);
  }

  async remove(id: number): Promise<{ message: string }> {
    const leave = await this.findOne(id);
    await this.leaveRepository.remove(leave);
    return { message: `Licencia #${id} eliminada correctamente` };
  }

  // Método esencial para verificar si un empleado estará disponible en una fecha
  async isEmployeeAvailable(employeeId: number, fecha: Date): Promise<boolean> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    const leaveCount = await this.leaveRepository.count({
      where: {
        employeeId,
        fechaInicio: LessThanOrEqual(endOfDay),
        fechaFin: MoreThanOrEqual(startOfDay),
        aprobado: true,
      },
    });

    return leaveCount === 0;
  }

  // Obtener todas las licencias activas/programadas para una fecha específica
  async getActiveLeaves(fecha: Date): Promise<EmployeeLeave[]> {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    return this.leaveRepository.find({
      where: {
        fechaInicio: LessThanOrEqual(endOfDay),
        fechaFin: MoreThanOrEqual(startOfDay),
        aprobado: true,
      },
      relations: ['employee'],
    });
  }

  async approve(id: number): Promise<EmployeeLeave> {
    this.logger.log(`Aprobando licencia con ID: ${id}`);

    const leave = await this.findOne(id);
    if (leave.aprobado === true) {
      throw new BadRequestException(
        `La licencia con ID ${id} ya está aprobada`,
      );
    }

    // Convertir las fechas a objetos Date si son strings
    const fechaInicio =
      leave.fechaInicio instanceof Date
        ? leave.fechaInicio
        : new Date(leave.fechaInicio);
    const fechaFin =
      leave.fechaFin instanceof Date
        ? leave.fechaFin
        : new Date(leave.fechaFin);

    // Verificar disponibilidad de días
    const employee = await this.employeesService.findOne(leave.employeeId);
    if (!employee) {
      throw new NotFoundException(
        `Empleado con ID ${leave.employeeId} no encontrado`,
      );
    }

    // Calcular días usados
    const diasUsados = fechaFin.getTime() - fechaInicio.getTime();
    const diasUsadosEnLicencia = Math.ceil(diasUsados / (1000 * 3600 * 24));
    const diasDisponibles = employee.diasVacacionesRestantes;
    console.log('employee: ', employee);

    this.logger.log(`Días usados en licencia: ${diasUsadosEnLicencia}`);
    this.logger.log(`Días disponibles: ${diasDisponibles}`);

    if (diasUsadosEnLicencia > diasDisponibles) {
      throw new BadRequestException(
        `El empleado no tiene suficientes días de licencia disponibles`,
      );
    }

    // Actualizar los días del empleado
    const diasRestantes = diasDisponibles - diasUsadosEnLicencia;

    this.logger.log(
      `Actualizando empleado ID ${employee.id}, días restantes: ${diasRestantes}`,
    );

    await this.employeesService.update(employee.id, {
      diasVacacionesRestantes: diasRestantes,
      diasVacacionesUsados:
        employee.diasVacacionesUsados + diasUsadosEnLicencia,
    });

    // Aprobar la licencia
    leave.aprobado = true;

    return await this.findOne(id);
  }
}
