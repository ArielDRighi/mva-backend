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
} from '../entities/contractual_conditions.entity';
import { ServiceType } from 'src/common/enums/resource-states.enum';

export class ModifyCondicionContractualDto {
  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => {
    if (
      value &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        value instanceof Date)
    ) {
      return new Date(value);
    }
    return null;
  })
  fecha_inicio?: Date;

  @IsOptional()
  @IsDate()
  @Transform(({ value }) => {
    if (
      value &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        value instanceof Date)
    ) {
      return new Date(value);
    }
    return null;
  })
  fecha_fin?: Date;

  @IsOptional()
  @MaxLength(500)
  condiciones_especificas?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifa?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifa_alquiler?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifa_instalacion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tarifa_limpieza?: number;

  @IsOptional()
  @IsEnum(ServiceType)
  tipo_servicio?: ServiceType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cantidad_banos?: number;

  @IsOptional()
  @IsEnum(Periodicidad)
  periodicidad?: Periodicidad;

  @IsOptional()
  @IsEnum(EstadoContrato)
  estado?: EstadoContrato;
}
