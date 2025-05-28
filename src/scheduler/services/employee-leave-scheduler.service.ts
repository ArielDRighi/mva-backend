import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeLeave } from '../../employee_leaves/entities/employee-leave.entity';
import { EmployeesService } from '../../employees/employees.service';
import { format as dateFormat } from 'date-fns';

@Injectable()
export class EmployeeLeaveSchedulerService {
  private readonly logger = new Logger(EmployeeLeaveSchedulerService.name);

  constructor(
    @InjectRepository(EmployeeLeave)
    private leaveRepository: Repository<EmployeeLeave>,
    private employeesService: EmployeesService,
  ) {}

  @Cron('0 0 * * *') // Ejecutar todos los días a medianoche
  async handleScheduledLeaves() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.logger.log(
      `Ejecutando actualización de estados por licencias: ${dateFormat(today, 'yyyy-MM-dd')}`,
    );

    // Buscar empleados que inician licencia hoy
    const startingLeaves = await this.leaveRepository.find({
      where: {
        fechaInicio: today,
        aprobado: true,
      },
      relations: ['employee'],
    });

    // Marcar empleados como NO_DISPONIBLE
    for (const leave of startingLeaves) {
      this.logger.log(
        `Empleado ${leave.employeeId} inicia periodo de licencia (${leave.tipoLicencia})`,
      );
      await this.employeesService.changeStatus(
        leave.employeeId,
        'NO_DISPONIBLE',
      );
    }

    // Buscar empleados que finalizan licencia hoy
    const endingLeaves = await this.leaveRepository.find({
      where: {
        fechaFin: today,
        aprobado: true,
      },
      relations: ['employee'],
    });

    // Marcar empleados como DISPONIBLE nuevamente
    for (const leave of endingLeaves) {
      // Verificar si no tiene otra licencia que comienza inmediatamente
      const nextLeave = await this.leaveRepository.findOne({
        where: {
          employeeId: leave.employeeId,
          fechaInicio: today,
          aprobado: true,
        },
      });

      if (!nextLeave) {
        this.logger.log(
          `Empleado ${leave.employeeId} finaliza periodo de licencia, vuelve a estar disponible`,
        );
        await this.employeesService.changeStatus(
          leave.employeeId,
          'DISPONIBLE',
        );
      }
    }
  }
}
