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
import { Transform } from 'class-transformer';

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
  @Transform(({ value }): number | undefined => value || undefined)
  empleadoId: number | null;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleado_id' })
  @Transform(({ value }): Empleado | undefined => value || undefined)
  empleado: Empleado | null;

  @Column({
    name: 'rol_empleado',
    type: 'enum',
    enum: ['A', 'B'],
    nullable: true,
  })
  rolEmpleado: 'A' | 'B' | null;

  @Column({ name: 'vehiculo_id', nullable: true })
  @Transform(({ value }): number | undefined => value || undefined)
  vehiculoId: number | null;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehiculo_id' })
  @Transform(({ value }): Vehicle | undefined => value || undefined)
  vehiculo: Vehicle | null;

  @Column({ name: 'bano_id', nullable: true })
  @Transform(({ value }): number | undefined => value || undefined)
  banoId: number | null;

  @ManyToOne(() => ChemicalToilet, { nullable: true })
  @JoinColumn({ name: 'bano_id' })
  @Transform(({ value }): ChemicalToilet | undefined => value || undefined)
  bano: ChemicalToilet | null;

  @CreateDateColumn({ name: 'fecha_asignacion' })
  fechaAsignacion: Date;

  // Método auxiliar para determinar el tipo de recurso
  getTipoRecurso(): 'empleado' | 'vehiculo' | 'bano' | 'mixto' {
    if (this.empleadoId && !this.vehiculoId && !this.banoId) return 'empleado';
    if (!this.empleadoId && this.vehiculoId && !this.banoId) return 'vehiculo';
    if (!this.empleadoId && !this.vehiculoId && this.banoId) return 'bano';
    return 'mixto';
  }
}
