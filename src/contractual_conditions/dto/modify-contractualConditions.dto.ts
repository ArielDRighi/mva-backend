import {
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  EstadoContrato,
  Periodicidad,
  TipoContrato,
} from '../entities/contractualConditions.entity';

export class ModifyCondicionContractualDto {
  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsOptional()
  @IsEnum(TipoContrato)
  tipo_de_contrato?: TipoContrato;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  fecha_inicio?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => (value ? new Date(value) : null))
  fecha_fin?: Date;

  @IsOptional()
  @MaxLength(500)
  condiciones_especificas?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifa?: number;

  @IsOptional()
  @IsEnum(Periodicidad)
  periodicidad?: Periodicidad;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;
}
