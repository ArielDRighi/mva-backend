import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'employees' })
export class Empleado {
  @PrimaryGeneratedColumn({ name: 'empleado_id' })
  id: number;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'apellido', length: 100 })
  apellido: string;

  @Column({ name: 'documento', length: 20, unique: true })
  documento: string;

  @Column({ name: 'telefono', length: 20 })
  telefono: string;

  @Column({ name: 'email', length: 100, unique: true })
  email: string;

  @Column({ name: 'direccion', length: 200, nullable: true })
  direccion: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
  fecha_nacimiento: Date;

  @Column({ name: 'fecha_contratacion', type: 'date' })
  fecha_contratacion: Date;

  @Column({ name: 'cargo', length: 100 })
  cargo: string;

  @Column({ name: 'estado', length: 20, default: 'ACTIVO' })
  estado: string;

  @OneToOne(() => User, (user) => user.empleadoId, { nullable: true })
  usuario: User;
}
