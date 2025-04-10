import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ServiceState,
  ServiceType,
} from '../../common/enums/resource-states.enum';

export class CreateServiceDto {
  @IsNumber()
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  clienteId: number;

  @IsDateString()
  @IsNotEmpty({ message: 'La fecha programada es requerida' })
  fechaProgramada: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsEnum(ServiceType)
  @IsNotEmpty({ message: 'El tipo de servicio es requerido' })
  tipoServicio: ServiceType;

  @IsOptional()
  @IsEnum(ServiceState)
  estado?: ServiceState = ServiceState.PENDIENTE_RECURSOS;

  @IsNumber()
  @Min(1, { message: 'La cantidad de baños debe ser al menos 1' })
  cantidadBanos: number;

  // Nuevos campos para cantidad de recursos
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'La cantidad de empleados debe ser al menos 1' })
  cantidadEmpleados: number = 1; // Valor por defecto: 1

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'La cantidad de vehículos debe ser al menos 1' })
  cantidadVehiculos: number = 1; // Valor por defecto: 1

  @IsString()
  @IsNotEmpty({ message: 'La ubicación del servicio es requerida' })
  ubicacion: string;

  @IsOptional()
  @IsString()
  notas?: string;

  @IsOptional()
  @IsBoolean()
  asignacionAutomatica: boolean = true;

  @IsOptional()
  @Type(() => ResourceAssignmentDto)
  asignacionesManual?: ResourceAssignmentDto[];
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
}
