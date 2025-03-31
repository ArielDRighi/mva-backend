import { ToiletMaintenance } from 'src/toilet_maintenance/entities/toilet_maintenance.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chemical_toilets' })
export class ChemicalToilet {
  @PrimaryGeneratedColumn()
  baño_id: number;

  @Column()
  codigo_interno: string;

  @Column()
  modelo: string;

  @Column()
  fecha_adquisicion: Date;

  @Column()
  estado: string;

  @OneToMany(() => ToiletMaintenance, (maintenance) => maintenance.toilet, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  maintenances: ToiletMaintenance[];
}
