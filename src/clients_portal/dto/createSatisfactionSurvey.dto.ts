import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSatisfactionSurveyDto {
  @IsNotEmpty()
  @IsString()
  cliente: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  fecha_mantenimiento: Date;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5) // Asumiendo que la calificación es del 1 al 5, ajústalo según tu escala
  calificacion: number;

  @IsOptional()
  @IsString()
  comentario: string;

  @IsOptional()
  @IsString()
  asunto: string;

  @IsOptional()
  @IsString()
  aspecto_evaluado: string;
}
