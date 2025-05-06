import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateExamenPreocupacionalDto {
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @Type(() => Date)
  fecha_examen?: Date;

  @IsOptional()
  @IsString()
  resultado?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  realizado_por?: string;
}
