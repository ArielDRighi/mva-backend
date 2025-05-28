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
import { FuturasLimpiezas } from 'src/future_cleanings/entities/futureCleanings.entity';

@Entity({ name: 'servicios' })
export class Service {
  @PrimaryGeneratedColumn({ name: 'servicio_id' })
  id: number;

  @Column({ name: 'cliente_id', nullable: true })
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
    default: ServiceState.PROGRAMADO,
  })
  estado: ServiceState;

  @Column({ name: 'cantidad_banos', default: 1 })
  cantidadBanos: number;

  // Reemplazamos cantidadEmpleados por el valor fijo de 2
  @Column({ name: 'cantidad_empleados', default: 2 })
  cantidadEmpleados: number = 2; // Siempre será 2

  // Añadimos identificadores específicos para empleadoA y empleadoB con tipo explíci

  @Column({ name: 'cantidad_vehiculos', default: 1 })
  cantidadVehiculos: number;

  @Column({ name: 'ubicacion', type: 'text' })
  ubicacion: string;

  @Column({ name: 'notas', type: 'text', nullable: true })
  notas: string;

  @Column({ name: 'asignacion_automatica', type: 'boolean', default: true })
  asignacionAutomatica: boolean;

  @Column({ type: 'simple-array', nullable: true })
  banosInstalados: number[];

  @Column({ nullable: true })
  condicionContractualId: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  fechaFinAsignacion: Date;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'comentario_incompleto', type: 'text', nullable: true })
  comentarioIncompleto: string;

  @OneToMany(() => ResourceAssignment, (assignment) => assignment.servicio, {
    cascade: ['insert', 'update'],
  })
  asignaciones: ResourceAssignment[];

  @OneToMany(
    () => FuturasLimpiezas,
    (futuraLimpieza) => futuraLimpieza.servicio,
  )
  futurasLimpiezas: FuturasLimpiezas[];
}
