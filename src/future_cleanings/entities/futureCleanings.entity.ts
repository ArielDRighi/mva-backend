import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'future_cleanings' })
export class FuturasLimpiezas {
  @PrimaryGeneratedColumn({ name: 'limpieza_id' })
  id: number;

  @Column({ name: 'limpieza_fecha' })
  fecha_de_limpieza: Date;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @Column({ name: 'numero_de_limpieza' })
  numero_de_limpieza: number;

  // Relacion con Servicio de instalacion
}
