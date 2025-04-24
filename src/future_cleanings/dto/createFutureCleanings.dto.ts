import {
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateFutureCleaningDto {
  @IsNotEmpty()
  @IsNumber()
  clientId: number;

  @IsNotEmpty()
  @IsDate()
  fecha_de_limpieza: Date;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNotEmpty()
  @IsNumber()
  servicioId: number;
}
