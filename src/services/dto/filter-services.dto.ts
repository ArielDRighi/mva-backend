import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';

export class FilterServicesDto {
  @IsOptional()
  @IsNumber()
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
