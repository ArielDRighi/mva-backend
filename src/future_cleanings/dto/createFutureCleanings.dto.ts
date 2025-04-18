import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateFutureCleaningDto {
  @IsNotEmpty()
  fecha_de_limpieza: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNotEmpty()
  @IsNumber()
  numero_de_limpieza: number;

  // @IsNotEmpty()
  // @IsNumber()
  // id_servicio_instalacion: number;
}
