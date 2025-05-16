// salary-advance.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empleado } from 'src/employees/entities/employee.entity';

@Entity()
export class SalaryAdvance {
  @PrimaryGeneratedColumn({ name: 'advance_id' })
  id: number;

  @ManyToOne(() => Empleado, (empleado) => empleado.advances, { eager: true })
  employee: Empleado;

  @Column('decimal')
  amount: number;

  @Column()
  reason: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ nullable: true })
  approvedAt: Date;
}
