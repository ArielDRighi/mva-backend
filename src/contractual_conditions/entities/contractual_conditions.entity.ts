import { IsEnum, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { Cliente } from 'src/clients/entities/client.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ServiceType } from 'src/common/enums/resource-states.enum';

export enum Periodicidad {
  DIARIA = 'Diaria',
  DOS_VECES_SEMANA = 'Dos veces por semana',
  TRES_VECES_SEMANA = 'Tres veces por semana',
  CUATRO_VECES_SEMANA = 'Cuatro veces por semana',
  SEMANAL = 'Semanal',
  QUINCENAL = 'Quincenal',
  MENSUAL = 'Mensual',
  ANUAL = 'Anual',
}

export enum EstadoContrato {
  ACTIVO = 'Activo',
  INACTIVO = 'Inactivo',
  TERMINADO = 'Terminado',
}

@Entity({ name: 'contractual_conditions' })
export class CondicionesContractuales {
  @PrimaryGeneratedColumn({ name: 'condicionContractual_id' })
  condicionContractualId: number;
  @ManyToOne(() => Cliente, (cliente) => cliente.contratos, {
    onDelete: 'CASCADE',
  })
  cliente: Cliente;

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
    name: 'tarifa_alquiler',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  @IsOptional()
  @Min(0)
  tarifa_alquiler: number;

  @Column({
    name: 'tarifa_instalacion',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  @IsOptional()
  @Min(0)
  tarifa_instalacion: number;

  @Column({
    name: 'tarifa_limpieza',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  @IsOptional()
  @Min(0)
  tarifa_limpieza: number;

  @Column({
    name: 'tipo_servicio',
    type: 'enum',
    enum: ServiceType,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(ServiceType)
  tipo_servicio: ServiceType;

  @Column({
    name: 'cantidad_banos',
    type: 'int',
    nullable: true,
  })
  @IsOptional()
  @Min(0)
  cantidad_banos: number;

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
