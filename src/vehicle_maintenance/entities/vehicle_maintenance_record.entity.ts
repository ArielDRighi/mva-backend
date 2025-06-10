import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity({ name: 'vehicle_maintenance' }) // Corregido el nombre de la tabla
export class VehicleMaintenanceRecord {
  @PrimaryGeneratedColumn({ name: 'mantenimiento_id' })
  id: number;

  @Column({ name: 'vehiculo_id' })
  vehiculoId: number;
  @Column({ name: 'fecha_mantenimiento', type: 'timestamp', nullable: true })
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

  @Column({ name: 'completado', default: false })
  completado: boolean;

  @Column({ name: 'fecha_completado', type: 'timestamp', nullable: true })
  fechaCompletado: Date;
}
