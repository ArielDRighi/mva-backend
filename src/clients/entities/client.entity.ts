import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CondicionesContractuales } from '../../contractual_conditions/entities/contractual_conditions.entity';
import { Service } from '../../services/entities/service.entity';
import { FuturasLimpiezas } from 'src/future_cleanings/entities/futureCleanings.entity';

@Entity({ name: 'clients' })
export class Cliente {
  @PrimaryGeneratedColumn({ name: 'cliente_id' })
  clienteId: number;

  @Column({ name: 'nombre_empresa' })
  nombre: string;

  @Column({ name: 'email' })
  email: string;

  @Column({ name: 'cuit', unique: true })
  cuit: string;

  @Column({ name: 'direccion' })
  direccion: string;

  @Column({ name: 'telefono' })
  telefono: string;

  // Contacto principal
  @Column({ name: 'contacto_principal' })
  contacto_principal: string;

  @Column({ name: 'contacto_principal_telefono', nullable: true })
  contacto_principal_telefono?: string;

  // Contacto obra 1
  @Column({ name: 'contacto_obra1', nullable: true })
  contactoObra1?: string;

  @Column({ name: 'contacto_obra1_telefono', nullable: true })
  contacto_obra1_telefono?: string;

  // Contacto obra 2
  @Column({ name: 'contacto_obra2', nullable: true })
  contactoObra2?: string;

  @Column({ name: 'contacto_obra2_telefono', nullable: true })
  contacto_obra2_telefono?: string;

  @Column({
    name: 'fecha_registro',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_registro: Date;

  @Column({ name: 'estado', default: 'ACTIVO' })
  estado: string;

  @OneToMany(() => CondicionesContractuales, (condicion) => condicion.cliente)
  contratos: CondicionesContractuales[];

  @OneToMany(() => Service, (servicio) => servicio.cliente)
  servicios: Service[];

  @OneToMany(() => FuturasLimpiezas, (futuraLimpieza) => futuraLimpieza.cliente)
  futurasLimpiezas: FuturasLimpiezas[];
}
