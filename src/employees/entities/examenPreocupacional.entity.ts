import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empleado } from './employee.entity';

@Entity({ name: 'examen_preocupacional' })
export class ExamenPreocupacional {
  @PrimaryGeneratedColumn()
  examen_preocupacional_id: number;

  @Column()
  fecha_examen: Date;

  @Column()
  resultado: string;

  @Column()
  observaciones: string;

  @Column()
  realizado_por: string;

  @ManyToOne(() => Empleado, (empleado) => empleado.examenesPreocupacionales)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;
}
