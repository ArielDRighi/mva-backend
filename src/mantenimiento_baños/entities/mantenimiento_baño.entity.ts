import { BañosQuimico } from 'src/baños_quimicos/entities/baños_quimico.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'mantenimiento_baños' })
export class MantenimientoBaño {
  @PrimaryGeneratedColumn()
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

  @Column()
  costo: number;

  @ManyToOne(() => BañosQuimico, (baño) => baño.mantenimientos)
  baño: BañosQuimico;
}
