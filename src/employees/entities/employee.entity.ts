import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { EmployeeLeave } from '../../employee_leaves/entities/employee-leave.entity';
import { SalaryAdvance } from 'src/salary_advance/entities/salary_advance.entity';
import { RopaTalles } from 'src/clothing/entities/clothing.entity';
import { ContactosEmergencia } from './emergencyContacts.entity';
import { Licencias } from './license.entity';
import { ExamenPreocupacional } from './examenPreocupacional.entity';

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

  @Column({ name: 'estado', length: 20, default: 'DISPONIBLE' })
  estado: string;

  @Column({
    name: 'Legajo',
    type: 'decimal',
    nullable: true,
  })
  numero_legajo: number;

  @Column({ name: 'CUIL', length: 20, unique: true, nullable: true })
  cuil: string;

  @Column({ name: 'CBU', length: 22, unique: true, nullable: true })
  cbu: string;

  @OneToMany(() => ContactosEmergencia, (contact) => contact.empleado, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  emergencyContacts: ContactosEmergencia[];

  @OneToOne(() => Licencias, (licencia) => licencia.empleado, {
    nullable: true,
  })
  licencia: Licencias;

  @OneToOne(() => User, (user) => user.empleadoId, { nullable: true })
  usuario: User;

  @Column({ default: 14, type: 'int', nullable: true })
  diasVacacionesTotal: number;

  @Column({ default: 14, type: 'int', nullable: true })
  diasVacacionesRestantes: number;

  @Column({ default: 0, type: 'int', nullable: true })
  diasVacacionesUsados: number;

  @OneToMany(() => EmployeeLeave, (leave) => leave.employee)
  leaves: EmployeeLeave[];

  @OneToMany(() => SalaryAdvance, (advance) => advance.employee)
  advances: SalaryAdvance[];

  @OneToOne(() => RopaTalles, (talleRopa) => talleRopa.empleado)
  talleRopa: RopaTalles;
  @OneToMany(
    () => ExamenPreocupacional,
    (examenPreocupacional) => examenPreocupacional.empleado,
  )
  examenesPreocupacionales: ExamenPreocupacional[];
}
