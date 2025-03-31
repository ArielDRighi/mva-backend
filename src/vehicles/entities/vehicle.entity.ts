import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VehicleMaintenanceRecord } from '../../vehicle_maintenance/entities/vehicle-maintenance-record.entity';

@Entity({ name: 'vehiculos' })
export class Vehicle {
  @PrimaryGeneratedColumn({ name: 'vehiculo_id' })
  id: number;

  @Column({ name: 'placa', unique: true })
  placa: string;

  @Column({ name: 'marca' })
  marca: string;

  @Column({ name: 'modelo' })
  modelo: string;

  @Column({ name: 'año' })
  anio: number;

  @Column({ name: 'capacidad_carga', type: 'numeric', precision: 8, scale: 2 })
  capacidadCarga: number;

  @Column({ name: 'estado', default: 'ACTIVO' })
  estado: string;

  @OneToMany(
    () => VehicleMaintenanceRecord,
    (maintenanceRecord) => maintenanceRecord.vehicle,
  )
  maintenanceRecords: VehicleMaintenanceRecord[];
}
