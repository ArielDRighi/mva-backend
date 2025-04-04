import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ServiceStatus, ServiceType } from '../entities/service.entity';

export class CreateServiceDto {
  @IsNumber()
  @IsNotEmpty({ message: 'El ID del cliente es requerido' })
  clienteId: number;

  @IsNotEmpty({ message: 'La fecha programada es requerida' })
  @Type(() => Date)
  fechaProgramada: Date;

  @IsOptional()
  @Type(() => Date)
  fechaInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  fechaFin?: Date;

  @IsEnum(ServiceType, { message: 'Tipo de servicio inválido' })
  tipoServicio: ServiceType;

  @IsEnum(ServiceStatus, { message: 'Estado de servicio inválido' })
  @IsOptional()
  estado?: ServiceStatus;

  @IsNumber()
  @Min(1, { message: 'La cantidad de baños debe ser al menos 1' })
  cantidadBanos: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad de vehículos debe ser al menos 1' })
  @IsOptional()
  cantidadVehiculos?: number;

  @IsString()
  @IsNotEmpty({ message: 'La ubicación es requerida' })
  ubicacion: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  prioridad?: string = 'Normal';
}
