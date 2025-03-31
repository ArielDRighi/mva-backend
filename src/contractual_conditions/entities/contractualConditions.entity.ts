import { IsEnum, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Cliente } from 'src/clients/entities/client.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum TipoContrato {
  TEMPORAL = 'Temporal',
  PERMANENTE = 'Permanente',
}

export enum Periodicidad {
  DIARIA = 'Diaria',
  SEMANAL = 'Semanal',
  MENSUAL = 'Mensual',
  ANUAL = 'Anual',
}

export enum EstadoContrato {
  ACTIVO = 'Activo',
  INACTIVO = 'Inactivo',
  TERMINADO = 'Terminado',
}

@Entity({ name: 'condiciones_contractuales' })
export class CondicionesContractuales {
  @PrimaryGeneratedColumn({ name: 'condicionContractual_id' })
  condicionContractualId: number;

  @ManyToOne(() => Cliente, (cliente) => cliente.contratos, {
    onDelete: 'CASCADE',
  })
  cliente: Cliente;

  @Column({ name: 'tipo_de_contrato', type: 'enum', enum: TipoContrato })
  @IsEnum(TipoContrato)
  tipo_de_contrato: TipoContrato;

  @Column({ name: 'fecha_inicio', type: 'date', nullable: false })
  @IsNotEmpty()
  fecha_inicio: Date;

  @Column({ name: 'fecha_fin', type: 'date', nullable: false })
  @IsNotEmpty()
  fecha_fin: Date;

  @Column({ name: 'condiciones_especificas', type: 'text', nullable: true })
  @IsOptional()
  @Length(0, 500)
  condiciones_especificas: string;

  @Column({
    name: 'tarifa',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  @Min(0)
  tarifa: number;

  @Column({
    name: 'periodicidad',
    type: 'enum',
    enum: Periodicidad,
    nullable: false,
  })
  @IsEnum(Periodicidad)
  periodicidad: Periodicidad;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoContrato,
    default: EstadoContrato.ACTIVO,
  })
  @IsEnum(EstadoContrato)
  estado: EstadoContrato;
}
