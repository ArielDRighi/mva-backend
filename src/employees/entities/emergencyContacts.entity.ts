import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Empleado } from './employee.entity';

@Entity({ name: 'emergency_contacts' })
export class ContactosEmergencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre', length: 100 })
  nombre: string;

  @Column({ name: 'apellido', length: 100 })
  apellido: string;

  @Column({ name: 'parentesco', length: 50 })
  parentesco: string;

  @Column({ name: 'telefono', length: 20 })
  telefono: string;

  @ManyToOne(() => Empleado, (empleado) => empleado.emergencyContacts, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  empleado: Empleado;
}
