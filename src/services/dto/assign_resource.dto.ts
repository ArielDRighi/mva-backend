import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AssignResourceDto {
  @IsNumber()
  servicioId: number;

  @IsNumber()
  @IsOptional()
  empleadoId?: number;

  @IsNumber()
  @IsOptional()
  vehiculoId?: number;

  @IsNumber()
  @IsOptional()
  banoId?: number;

  @IsString()
  @IsOptional()
  notas?: string;
}
