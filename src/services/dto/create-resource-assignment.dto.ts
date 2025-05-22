import { IsNumber, IsOptional } from 'class-validator';

export class CreateResourceAssignmentDto {
  @IsOptional()
  @IsNumber()
  empleadoAId?: number;

  @IsOptional()
  @IsNumber()
  empleadoBId?: number;

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
