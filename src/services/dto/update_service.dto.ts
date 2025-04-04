import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ServiceStatus, ServiceType } from '../entities/service.entity';

export class UpdateServiceDto {
  @IsNumber()
  @IsOptional()
  clienteId?: number;

  @IsOptional()
  @Type(() => Date)
  fechaProgramada?: Date;

  @IsOptional()
  @Type(() => Date)
  fechaInicio?: Date;

  @IsOptional()
  @Type(() => Date)
  fechaFin?: Date;

  @IsEnum(ServiceType, { message: 'Tipo de servicio inválido' })
  @IsOptional()
  tipoServicio?: ServiceType;

  @IsEnum(ServiceStatus, { message: 'Estado de servicio inválido' })
  @IsOptional()
  estado?: ServiceStatus;

  @IsNumber()
  @Min(1, { message: 'La cantidad de baños debe ser al menos 1' })
  @IsOptional()
  cantidadBanos?: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad de vehículos debe ser al menos 1' })
  @IsOptional()
  cantidadVehiculos?: number;

  @IsString()
  @IsOptional()
  ubicacion?: string;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsString()
  @IsOptional()
  prioridad?: string;
}
