import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  placa?: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900, { message: 'El año debe ser válido' })
  anio?: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'La capacidad de carga debe ser mayor o igual a cero' })
  capacidadCarga?: number;

  @IsString()
  @IsOptional()
  estado?: string;
}
