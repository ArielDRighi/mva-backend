import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';
import { ResourceAssignmentDto } from './create-service.dto';

export class UpdateServiceDto {
  @IsOptional()
  @IsNumber()
  clienteId?: number;

  @IsOptional()
  @IsDateString()
  fechaProgramada?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  tipoServicio?: ServiceType;

  @IsOptional()
  @IsEnum(ServiceState)
  estado?: ServiceState;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'La cantidad de baños debe ser al menos 1' })
  cantidadBanos?: number;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsBoolean()
  asignacionAutomatica?: boolean;

  @IsOptional()
  @Type(() => ResourceAssignmentDto)
  asignacionesManual?: ResourceAssignmentDto[];
}
