import { MantenimientoBaño } from 'src/mantenimiento_baños/entities/mantenimiento_baño.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'banos_quimicos' })
export class BañosQuimico {
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

  @OneToMany(() => MantenimientoBaño, (mantenimiento) => mantenimiento.baño, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  mantenimientos: MantenimientoBaño[];
}
