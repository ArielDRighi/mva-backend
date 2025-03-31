import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import {
  EstadoContrato,
  Periodicidad,
  TipoContrato,
} from '../entities/contractualConditions.entity';
import { Transform } from 'class-transformer';

export class CreateContractualConditionDto {
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  clientId: number;

  @IsNotEmpty()
  @IsEnum(TipoContrato)
  tipo_de_contrato: TipoContrato;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  fecha_inicio: Date;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  fecha_fin: Date;

  @IsOptional()
  @MaxLength(500)
  condiciones_especificas?: string;

  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0)
  tarifa: number;

  @IsNotEmpty()
  @IsEnum(Periodicidad)
  periodicidad: Periodicidad;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;
}
