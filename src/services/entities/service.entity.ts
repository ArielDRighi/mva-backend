import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cliente } from '../../clients/entities/client.entity';
import { ResourceAssignment } from './resource_assignment.entity';

export enum ServiceType {
  INSTALACION = 'Instalación',
  RETIRO = 'Retiro',
  LIMPIEZA = 'Limpieza',
  MANTENIMIENTO = 'Mantenimiento',
  REPARACION = 'Reparación',
}

export enum ServiceStatus {
  PROGRAMADO = 'Programado',
  EN_RUTA = 'En Ruta',
  EN_PROCESO = 'En Proceso',
  COMPLETADO = 'Completado',
  CANCELADO = 'Cancelado',
  REPROGRAMADO = 'Reprogramado',
}

@Entity({ name: 'servicios' })
export class Service {
  @PrimaryGeneratedColumn({ name: 'servicio_id' })
  servicioId: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.servicios)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'fecha_programada', type: 'timestamp' })
  fechaProgramada: Date;

  @Column({ name: 'fecha_inicio', type: 'timestamp', nullable: true })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fechaFin: Date;

  @Column({
    name: 'tipo_servicio',
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.LIMPIEZA,
  })
  tipoServicio: ServiceType;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.PROGRAMADO,
  })
  estado: ServiceStatus;

  @Column({ name: 'cantidad_banos', default: 1 })
  cantidadBanos: number;

  @Column({ name: 'cantidad_vehiculos', nullable: true })
  cantidadVehiculos: number;

  @Column({ name: 'ubicacion', type: 'text' })
  ubicacion: string;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notas: string;

  @Column({ name: 'prioridad', default: 'Normal' })
  prioridad: string;

  @OneToMany(() => ResourceAssignment, (assignment) => assignment.servicio)
  asignaciones: ResourceAssignment[];
}
