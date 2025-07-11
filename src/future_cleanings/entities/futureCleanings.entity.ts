import { Cliente } from 'src/clients/entities/client.entity';
import { Service } from 'src/services/entities/service.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'future_cleanings' })
export class FuturasLimpiezas {
  @PrimaryGeneratedColumn({ name: 'limpieza_id' })
  id: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.futurasLimpiezas)
  cliente: Cliente;

  @Column({ name: 'limpieza_fecha' })
  fecha_de_limpieza: Date;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @Column({ name: 'numero_de_limpieza' })
  numero_de_limpieza: number;

  // Relacion con Servicio de instalacion
  @ManyToOne(() => Service, (service) => service.futurasLimpiezas, {
    onDelete: 'CASCADE',
  })
  servicio: Service;
}
