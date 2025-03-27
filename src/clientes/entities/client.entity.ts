import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'clientes' }) // ✅ CORRECTO: nombre plural como en la DB
export class Cliente {
  @PrimaryGeneratedColumn({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'nombre_empresa' })
  nombre: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'cuit' })
  cuit: string;

  @Column({ name: 'direccion' })
  direccion: string;

  @Column({ name: 'telefono' })
  telefono: string;

  @Column({ name: 'contacto_principal' })
  contacto_principal: string;

  @Column({
    name: 'fecha_registro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_registro: Date;

  @Column({ name: 'estado', default: 'ACTIVO' })
  estado: string;
}
