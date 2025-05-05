import { Transform, Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateExamenPreocupacionalDto {
  @IsNotEmpty()
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  fecha_examen: Date;

  @IsNotEmpty()
  @IsString()
  resultado: string;

  @IsNotEmpty()
  @IsString()
  observaciones: string;

  @IsNotEmpty()
  @IsString()
  realizado_por: string;

  @IsNotEmpty()
  @IsNumber()
  empleado_id: number;
}
