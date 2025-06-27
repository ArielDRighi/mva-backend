import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Empleado } from './employee.entity';

@Entity({ name: 'family_members' })
export class FamilyMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'apellido', length: 100 })
  apellido: string;

  @Column({ name: 'parentesco', length: 50 })
  parentesco: string;

  @Column({ name: 'dni', length: 20 })
  dni: string;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fecha_nacimiento: Date;

  @ManyToOne(() => Empleado, (empleado) => empleado.familyMembers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  empleado: Empleado;
}
