import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateChemicalToiletDto {
  @IsOptional()
  @IsString()
  codigo_interno?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsDateString()
  fecha_adquisicion?: Date;

  @IsOptional()
  @IsString()
  estado?: string;
}
