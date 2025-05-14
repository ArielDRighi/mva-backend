import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empleado } from '../../employees/entities/employee.entity';

@Entity({ name: 'clothing_specs' })
export class RopaTalles {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Empleado, (empleado) => empleado.talleRopa)
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @Column({ nullable: true })
  calzado_talle: string;

  @Column({ nullable: true })
  pantalon_talle: string;

  @Column({ nullable: true })
  camisa_talle: string;

  @Column({ nullable: true })
  campera_bigNort_talle: string;

  @Column({ nullable: true })
  pielBigNort_talle: string;

  @Column({ nullable: true })
  medias_talle: string;

  @Column({ nullable: true })
  pantalon_termico_bigNort_talle: string;

  @Column({ nullable: true })
  campera_polar_bigNort_talle: string;

  @Column({ nullable: true })
  mameluco_talle: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
