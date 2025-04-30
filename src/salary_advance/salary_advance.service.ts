import { Empleado } from "src/employees/entities/employee.entity";
import { AdvanceRequest } from "./Interface/advance.interface";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { SalaryAdvance } from "./entities/salary_advance.entity";
import { CreateAdvanceDto } from "./dto/create-salary_advance.dto";

@Injectable()
export class SalaryAdvanceService {
  private advanceRequests: AdvanceRequest[] = [];

  @InjectRepository(Empleado)
  private employeeRepository: Repository<Empleado>;

  @InjectRepository(SalaryAdvance)
  private salaryAdvanceRepository: Repository<SalaryAdvance>;

  // Función para crear un adelanto salarial
  async createAdvance(dto: CreateAdvanceDto, user: any): Promise<SalaryAdvance> {
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
      employee, // Relacionamos el empleado con el adelanto
      amount: dto.amount,
      reason: dto.reason,
      status: 'pending',
    });

    // Guardar el adelanto en la base de datos
    return await this.salaryAdvanceRepository.save(newAdvance);
  }

  // Función para obtener todos los adelantos (puedes personalizarla más tarde)
  async getAll(): Promise<SalaryAdvance[]> {
    return await this.salaryAdvanceRepository.find({
      relations: ['employee'], // Incluye los datos del empleado
      order: { createdAt: 'DESC' },
    });
  }
  

  // Función para aprobar un adelanto salarial
  async approve(id: string, adminId: string): Promise<SalaryAdvance | null> {
    // Buscar la solicitud de adelanto
    const request = await this.salaryAdvanceRepository.findOne({
        where: { id: parseInt(id, 10) },
        relations: ['employee']  // Asegurarse de obtener la relación con el empleado
    });
    console.log('request', request);
    
    if (!request || request.status !== 'pending') {
        return null;  // Si no se encuentra la solicitud o no está pendiente, retornar null
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
      relations: ['employee']  // Asegurarse de obtener la relación con el empleado
  });

  if (!request || request.status !== 'pending') {
      return null;  // Si no se encuentra la solicitud o no está pendiente, retornar null
  }

  // Actualizar la solicitud a 'rejected'
  request.status = 'rejected';
  request.updatedAt = new Date();

  // Guardar la solicitud rechazada
  return await this.salaryAdvanceRepository.save(request);
}

}


