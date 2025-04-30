import { Empleado } from "src/employees/entities/employee.entity";
import { AdvanceRequest } from "./Interface/advance.interface";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SalaryAdvance } from "./entities/salary_advance.entity";
import { CreateAdvanceDto } from "./dto/create-salary_advance.dto";

@Injectable()
export class SalaryAdvanceService {
  private advanceRequests: AdvanceRequest[] = [];

  @InjectRepository(Empleado)
  private employeeRepository: Repository<Empleado>;

  @InjectRepository(SalaryAdvance)
  private salaryAdvanceRepository: Repository<SalaryAdvance>;

  async createAdvance(dto: CreateAdvanceDto, user: any) {
    console.log('Empleado ID:', user.empleadoId);
    // Obtener el empleado asociado con el token (usuario logueado)
    const employee = await this.employeeRepository.findOne({
      where: { id: user.empleadoId },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }

    // Crear el nuevo adelanto salarial
    const newAdvance = this.salaryAdvanceRepository.create({
      employee,    // Relacionamos el empleado con el adelanto
      amount: dto.amount,
      reason: dto.reason,
      status: 'pending',
    });

    // Guardar el adelanto en la base de datos
    return this.salaryAdvanceRepository.save(newAdvance);
  }
  
  

  getAll(): AdvanceRequest[] {
    return this.advanceRequests;
  }

  approve(id: string, adminId: string): AdvanceRequest | null {
    const request = this.advanceRequests.find(r => r.id === id);
    if (!request || request.status !== 'pending') return null;

    request.status = 'approved';
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    request.updatedAt = new Date();
    return request;
  }

  reject(id: string): AdvanceRequest | null {
    const request = this.advanceRequests.find(r => r.id === id);
    if (!request || request.status !== 'pending') return null;

    request.status = 'rejected';
    request.updatedAt = new Date();
    return request;
  }
}


