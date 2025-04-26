import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { Empleado } from '../../employees/entities/employee.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { ChemicalToilet } from '../../chemical_toilets/entities/chemical_toilet.entity';

@Entity({ name: 'asignacion_recursos' })
export class ResourceAssignment {
  @PrimaryGeneratedColumn({ name: 'asignacion_id' })
  id: number;

  @Column({ name: 'servicio_id' })
  servicioId: number;

  @ManyToOne(() => Service, (servicio) => servicio.asignaciones)
  @JoinColumn({ name: 'servicio_id' })
  servicio: Service;

  @Column({ name: 'empleado_id', nullable: true })
  empleadoId: number | null;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado | null;

  @Column({ name: 'vehiculo_id', nullable: true })
  vehiculoId: number | null;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehicle | null;

  @Column({ name: 'bano_id', nullable: true })
  banoId: number | null;

  @ManyToOne(() => ChemicalToilet, { nullable: true })
  @JoinColumn({ name: 'bano_id' })
  bano: ChemicalToilet | null;

  @CreateDateColumn({ name: 'fecha_asignacion' })
  fechaAsignacion: Date;
}
