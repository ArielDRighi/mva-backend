import { ChemicalToilet } from '../../chemical_toilets/entities/chemical-toilet.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mantenimiento_baños' })
export class ToiletMaintenance {
  @PrimaryGeneratedColumn({ name: 'mantenimiento_id' })
  mantenimiento_id: number;

  @Column({
    name: 'fecha_mantenimiento',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha_mantenimiento: Date;

  @Column()
  tipo_mantenimiento: string;

  @Column()
  descripcion: string;

  @Column()
  tecnico_responsable: string;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  costo: number;

  @ManyToOne(() => ChemicalToilet, (toilet) => toilet.maintenances)
  toilet: ChemicalToilet;
}
