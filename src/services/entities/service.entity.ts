import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cliente } from '../../clients/entities/client.entity';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';
import { ResourceAssignment } from './resource-assignment.entity';

@Entity({ name: 'servicios' })
export class Service {
  @PrimaryGeneratedColumn({ name: 'servicio_id' })
  id: number;

  @Column({ name: 'cliente_id' })
  clienteId: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.servicios)
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @Column({ name: 'fecha_programada', type: 'timestamp' })
  fechaProgramada: Date;

  @Column({ name: 'fecha_inicio', type: 'timestamp', nullable: true })
  fechaInicio: Date | null;

  @Column({ name: 'fecha_fin', type: 'timestamp', nullable: true })
  fechaFin: Date | null;

  @Column({
    name: 'tipo_servicio',
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.INSTALACION,
  })
  tipoServicio: ServiceType;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ServiceState,
    default: ServiceState.PENDIENTE_RECURSOS,
  })
  estado: ServiceState;

  @Column({ name: 'cantidad_banos', default: 1 })
  cantidadBanos: number;

  @Column({ name: 'ubicacion', type: 'text' })
  ubicacion: string;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notas: string;

  @Column({ name: 'asignacion_automatica', type: 'boolean', default: true })
  asignacionAutomatica: boolean;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @OneToMany(() => ResourceAssignment, (assignment) => assignment.servicio, {
    cascade: ['insert', 'update'],
  })
  asignaciones: ResourceAssignment[];
}
