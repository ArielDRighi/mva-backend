import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity({ name: 'mantenimiento_vehiculos' })
export class VehicleMaintenanceRecord {
  @PrimaryGeneratedColumn({ name: 'mantenimiento_id' })
  id: number;

  @Column({ name: 'vehiculo_id' })
  vehiculoId: number;

  @Column({ name: 'fecha_mantenimiento', type: 'timestamp' })
  fechaMantenimiento: Date;

  @Column({ name: 'tipo_mantenimiento' })
  tipoMantenimiento: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'costo', type: 'numeric', precision: 10, scale: 2 })
  costo: number;

  @Column({ name: 'proximo_mantenimiento', type: 'date', nullable: true })
  proximoMantenimiento: Date;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenanceRecords)
  @JoinColumn({ name: 'vehiculo_id' })
  vehicle: Vehicle;
}
