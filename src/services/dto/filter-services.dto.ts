import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsString,
} from 'class-validator';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';

export class FilterServicesDto {
  @IsOptional()
  @Type(() => Number) // ← Convierte el string a número
  @IsNumber({}, { message: 'El ID del cliente debe ser un número' })
  clienteId?: number;

  @IsOptional()
  @IsEnum(ServiceState)
  estado?: ServiceState;

  @IsOptional()
  @IsEnum(ServiceType)
  tipoServicio?: ServiceType;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  ubicacion?: string;
}
