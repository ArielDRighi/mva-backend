import { ChemicalToilet } from '../../chemical_toilets/entities/chemical_toilet.entity';
import { Empleado } from '../../employees/entities/employee.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'toilet_maintenance' })
export class ToiletMaintenance {
  @PrimaryGeneratedColumn({ name: 'mantenimiento_id' })
  mantenimiento_id: number;

  @Column({
    name: 'fecha_mantenimiento',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_mantenimiento: Date;

  @Column()
  tipo_mantenimiento: string;

  @Column()
  descripcion: string;
  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleado_id' })
  tecnicoResponsable: Empleado;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  costo: number;

  @ManyToOne(() => ChemicalToilet, (toilet) => toilet.maintenances)
  toilet: ChemicalToilet;

  @Column({ name: 'completado', default: false })
  completado: boolean;

  @Column({ name: 'fecha_completado', type: 'timestamp', nullable: true })
  fechaCompletado: Date;
}
