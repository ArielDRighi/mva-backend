import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { VehicleMaintenanceRecord } from '../../vehicle_maintenance/entities/vehicle_maintenance_record.entity';

export enum TipoCabina {
  SIMPLE = 'simple',
  DOBLE = 'doble',
}

@Entity({ name: 'vehicles' })
export class Vehicle {
  @PrimaryGeneratedColumn({ name: 'vehiculo_id' })
  id: number;

  @Column({ name: 'numero_interno', nullable: true })
  numeroInterno: string;

  @Column({ name: 'placa', unique: true })
  placa: string;

  @Column({ name: 'marca' })
  marca: string;

  @Column({ name: 'modelo' })
  modelo: string;

  @Column({ name: 'año' })
  anio: number;

  @Column({
    name: 'tipo_cabina',
    type: 'enum',
    enum: TipoCabina,
    default: TipoCabina.SIMPLE,
  })
  tipoCabina: TipoCabina;

  @Column({ name: 'fecha_vencimiento_vtv', type: 'date', nullable: true })
  fechaVencimientoVTV: Date;

  @Column({ name: 'fecha_vencimiento_seguro', type: 'date', nullable: true })
  fechaVencimientoSeguro: Date;

  @Column({ name: 'es_externo', type: 'boolean', default: false })
  esExterno: boolean;

  @Column({ name: 'estado', default: 'ACTIVO' })
  estado: string;

  @OneToMany(
    () => VehicleMaintenanceRecord,
    (maintenanceRecord) => maintenanceRecord.vehicle,
  )
  maintenanceRecords: VehicleMaintenanceRecord[];
}
