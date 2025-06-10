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
} from '../entities/contractual_conditions.entity';
import { Transform } from 'class-transformer';
import { ServiceType } from 'src/common/enums/resource-states.enum';

export class CreateContractualConditionDto {
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  clientId: number;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value as string | number | Date))
  fecha_inicio: Date;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value as string | number | Date))
  fecha_fin: Date;

  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value))
  @MaxLength(500)
  condiciones_especificas?: string;

  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0)
  tarifa: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0)
  tarifa_alquiler?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0)
  tarifa_instalacion?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0)
  tarifa_limpieza?: number;
  @IsOptional()
  @IsEnum(ServiceType)
  tipo_servicio?: ServiceType;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  @Min(0)
  cantidad_banos?: number;
  @IsOptional()
  @Transform(({ value }) => normalizeEnumValue(value))
  @IsEnum(Periodicidad)
  periodicidad: Periodicidad;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;
}
export function normalizeEnumValue(value: string): string {
  if (typeof value !== 'string') return value;

  return value
    .normalize('NFD') // separa tildes
    .replace(/[\u0300-\u036f]/g, '') // elimina tildes
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()); // primera letra en mayúscula
}
