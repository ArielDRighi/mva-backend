import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
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

  // Eliminamos cantidadEmpleados y agregamos empleadoA y empleadoB
  @IsOptional()
  @IsNumber()
  empleadoAId?: number;

  @IsOptional()
  @IsNumber()
  empleadoBId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'La cantidad de vehículos debe ser al menos 1' })
  cantidadVehiculos?: number;

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

  @IsOptional()
  @IsArray()
  @IsNumber(
    {},
    { each: true, message: 'Los IDs de baños instalados deben ser números' },
  )
  banosInstalados?: number[];
}
