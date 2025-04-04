import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Service } from './service.entity';
import { ChemicalToilet } from '../../chemical_toilets/entities/chemical_toilet.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity({ name: 'resource_allocation' })
export class ResourceAssignment {
  @PrimaryGeneratedColumn({ name: 'asignacion_id' })
  asignacionId: number;

  @Column({ name: 'servicio_id' })
  servicioId: number;

  @ManyToOne(() => Service, (service) => service.asignaciones)
  @JoinColumn({ name: 'servicio_id' })
  servicio: Service;

  @Column({ name: 'empleado_id', nullable: true })
  empleadoId: number;

  @Column({ name: 'vehiculo_id', nullable: true })
  vehiculoId: number;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehiculo_id' })
  vehiculo: Vehicle;

  @Column({ name: 'bano_id', nullable: true })
  banoId: number;

  @ManyToOne(() => ChemicalToilet)
  @JoinColumn({ name: 'bano_id' })
  bano: ChemicalToilet;

  @Column({
    name: 'fecha_asignacion',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaAsignacion: Date;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notas: string;
}
