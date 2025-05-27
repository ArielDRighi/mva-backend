import { Empleado } from 'src/employees/entities/employee.entity';
import { AdvanceRequest } from './Interface/advance.interface';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { SalaryAdvance } from './entities/salary_advance.entity';
import { CreateAdvanceDto } from './dto/create-salary_advance.dto';

@Injectable()
export class SalaryAdvanceService {
  private advanceRequests: AdvanceRequest[] = [];

  @InjectRepository(Empleado)
  private employeeRepository: Repository<Empleado>;

  @InjectRepository(SalaryAdvance)
  private salaryAdvanceRepository: Repository<SalaryAdvance>;

  // Función para crear un adelanto salarial
  async createAdvance(
    dto: CreateAdvanceDto,
    user: any,
  ): Promise<SalaryAdvance> {
    // Obtener el empleado asociado con el token (usuario logueado)
    const employee = await this.employeeRepository.findOne({
      where: { id: user.empleadoId },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    // Verificar si ya tiene un adelanto pendiente
    const pendingAdvance = await this.salaryAdvanceRepository.findOne({
      where: {
        employee: { id: employee.id },
        status: 'pending',
      },
    });

    if (pendingAdvance) {
      throw new BadRequestException(
        'Ya tienes una solicitud de adelanto pendiente. No puedes crear otra hasta que se resuelva la actual.',
      );
    }

    // Crear el nuevo adelanto salarial
    const newAdvance = this.salaryAdvanceRepository.create({
      employee, // Relacionamos el empleado con el adelanto
      amount: dto.amount,
      reason: dto.reason,
      status: 'pending',
    });

    // Guardar el adelanto en la base de datos
    return await this.salaryAdvanceRepository.save(newAdvance);
  }

  // Función para obtener todos los adelantos (puedes personalizarla más tarde)
  async getAll(
    status: string | undefined = undefined,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    advances: SalaryAdvance[];
    total: number;
    page: number;
    limit: number;
  }> {
    const advances = await this.salaryAdvanceRepository.find({
      where: status ? { status } : {},
      relations: ['employee'], // Asegurarse de obtener la relación con el empleado
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }, // Ordenar por fecha de creación
    });
    return {
      advances,
      total: await this.salaryAdvanceRepository.count({
        where: status ? { status } : {},
      }),
      page,
      limit,
    };
  }

  // Función para aprobar un adelanto salarial
  async approve(id: string, adminId: string): Promise<SalaryAdvance | null> {
    // Buscar la solicitud de adelanto
    const request = await this.salaryAdvanceRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['employee'], // Asegurarse de obtener la relación con el empleado
    });

    if (!request || request.status !== 'pending') {
      return null; // Si no se encuentra la solicitud o no está pendiente, retornar null
    }

    // Actualizar la solicitud a 'approved'
    request.status = 'approved';
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    request.updatedAt = new Date();

    // Guardar la solicitud aprobada
    return await this.salaryAdvanceRepository.save(request);
  }

  async reject(id: string): Promise<SalaryAdvance | null> {
    // Buscar la solicitud de adelanto
    const request = await this.salaryAdvanceRepository.findOne({
      where: { id: parseInt(id, 10) },
      relations: ['employee'], // Asegurarse de obtener la relación con el empleado
    });

    if (!request || request.status !== 'pending') {
      return null; // Si no se encuentra la solicitud o no está pendiente, retornar null
    }

    // Actualizar la solicitud a 'rejected'
    request.status = 'rejected';
    request.updatedAt = new Date();

    // Guardar la solicitud rechazada
    return await this.salaryAdvanceRepository.save(request);
  }

  async getEmployeeAdvances(user: any) {
    // Asegurarse de que el usuario esté autenticado
    if (!user || !user.empleadoId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    // Buscar al empleado por su ID
    const employee = await this.employeeRepository.findOne({
      where: { id: user.empleadoId },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    // Obtener los adelantos del empleado
    return await this.salaryAdvanceRepository.find({
      where: { employee: { id: employee.id } },
      order: { createdAt: 'DESC' },
    });
  }
}
