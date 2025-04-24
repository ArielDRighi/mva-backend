import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empleado } from '../../employees/entities/employee.entity';

export enum LeaveType {
  VACACIONES = 'VACACIONES',
  LICENCIA_MEDICA = 'LICENCIA_MEDICA',
  LICENCIA_PERSONAL = 'LICENCIA_PERSONAL',
  CAPACITACION = 'CAPACITACION',
  OTRO = 'OTRO',
}

@Entity('employee_leaves')
export class EmployeeLeave {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Empleado, (empleado) => empleado.leaves)
  @JoinColumn({ name: 'employee_id' })
  employee: Empleado;

  @Column({ name: 'employee_id' })
  employeeId: number;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date' })
  fechaFin: Date;

  @Column({
    type: 'enum',
    enum: LeaveType,
    default: LeaveType.VACACIONES,
  })
  tipoLicencia: LeaveType;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ default: false })
  aprobado: boolean;
}
