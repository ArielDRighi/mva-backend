import { IsNumber, IsOptional } from 'class-validator';

export class CreateResourceAssignmentDto {
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
