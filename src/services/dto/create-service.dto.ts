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
  IsInt,
} from 'class-validator';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';
import { CreateResourceAssignmentDto } from './create-resource-assignment.dto';

export class CreateServiceDto {
  @IsOptional()
  @IsNumber()
  @ValidateIf(
    (o: CreateServiceDto) => o.tipoServicio !== ServiceType.CAPACITACION,
  )
  clienteId?: number;

  @IsDate()
  @Type(() => Date)
  fechaProgramada: Date;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(ServiceType)
  @ValidateIf((o: CreateServiceDto) => !o.condicionContractualId)
  tipoServicio?: ServiceType;

  @IsOptional()
  @IsEnum(ServiceState)
  estado?: ServiceState;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o: CreateServiceDto) => !o.condicionContractualId)
  cantidadBanos?: number;

  @IsOptional()
  @IsNumber()
  empleadoAId?: number;

  @IsOptional()
  @IsNumber()
  empleadoBId?: number;

  @IsNumber()
  @ValidateIf(
    (o: CreateServiceDto) => o.tipoServicio !== ServiceType.CAPACITACION,
  )
  @Min(1, { message: 'La cantidad de vehículos debe ser al menos 1' })
  cantidadVehiculos: number;

  @IsString()
  ubicacion: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsOptional()
  @IsBoolean()
  asignacionAutomatica: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResourceAssignmentDto)
  @IsOptional()
  asignacionesManual?: CreateResourceAssignmentDto[];

  @IsArray()
  @IsOptional()
  @ValidateIf(
    (o: CreateServiceDto) =>
      !!o.tipoServicio &&
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
  @IsBoolean()
  forzar?: boolean;

  @IsOptional()
  @IsDateString()
  fechaFinAsignacion?: string;
}

export class ResourceAssignmentDto {
  @IsOptional()
  @IsEnum(['A', 'B'])
  rol?: 'A' | 'B';

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
