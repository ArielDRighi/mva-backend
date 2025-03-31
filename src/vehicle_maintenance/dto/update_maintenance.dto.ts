import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMaintenanceDto {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  fechaMantenimiento?: Date;

  @IsString()
  @IsOptional()
  tipoMantenimiento?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'El costo debe ser mayor o igual a cero' })
  costo?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  proximoMantenimiento?: Date;
}
