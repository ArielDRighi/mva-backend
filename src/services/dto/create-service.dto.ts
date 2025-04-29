import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateIf,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';
import { CreateResourceAssignmentDto } from './create-resource-assignment.dto';

export class CreateServiceDto {
  @IsNumber()
  clienteId: number;

  @IsDate()
  @Type(() => Date)
  fechaProgramada: Date;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsEnum(ServiceType)
  tipoServicio: ServiceType;

  @IsOptional()
  @IsEnum(ServiceState)
  estado?: ServiceState;

  @IsNumber()
  @Min(0)
  cantidadBanos: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad de empleados debe ser al menos 1' })
  cantidadEmpleados: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad de vehículos debe ser al menos 1' })
  cantidadVehiculos: number;

  @IsString()
  ubicacion: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsBoolean()
  asignacionAutomatica: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResourceAssignmentDto)
  @IsOptional()
  asignacionesManual?: CreateResourceAssignmentDto[];

  @IsArray()
  @IsOptional()
  @ValidateIf((o: CreateServiceDto) =>
    [
      'LIMPIEZA',
      'RETIRO',
      'REEMPLAZO',
      'MANTENIMIENTO_IN_SITU',
      'REPARACION',
    ].includes(o.tipoServicio),
  )
  banosInstalados?: number[];

  @IsOptional()
  @IsNumber()
  condicionContractualId?: number;

  @IsOptional()
  @IsDateString()
  fechaFinAsignacion?: string;
}

export class ResourceAssignmentDto {
  @IsOptional()
  @IsNumber()
  empleadoId?: number;

  @IsOptional()
  @IsNumber()
  vehiculoId?: number;

  @IsOptional()
  @IsNumber({}, { each: true })
  banosIds?: number[];

  @IsOptional()
  @IsString()
  search?: string;
}
