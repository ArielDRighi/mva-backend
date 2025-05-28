import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum RolEmpleado {
  A = 'A',
  B = 'B',
}
export class CreateResourceAssignmentDto {
  @IsOptional()
  @IsNumber()
  empleadoId?: number;

  @IsOptional()
  @IsNumber()
  vehiculoId?: number;

  @IsOptional()
  @IsEnum(['A', 'B'])
  rol?: 'A' | 'B';

  @IsOptional()
  @IsNumber({}, { each: true })
  banosIds?: number[];
}
