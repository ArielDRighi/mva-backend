import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empleado } from './employee.entity';

@Entity({ name: 'licenses' })
export class Licencias {
  @PrimaryGeneratedColumn()
  licencia_id: number;

  @Column()
  categoria: string;

  @Column()
  fecha_expedicion: Date;

  @Column()
  fecha_vencimiento: Date;

  @OneToOne(() => Empleado, (empleado) => empleado.licencia)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;
}
