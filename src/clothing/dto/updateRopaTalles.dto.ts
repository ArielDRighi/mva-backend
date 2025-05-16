import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateRopaTallesDto {
  @IsOptional()
  @IsString()
  calzado_talle?: string;

  @IsOptional()
  @IsString()
  pantalon_talle?: string;

  @IsOptional()
  @IsString()
  camisa_talle?: string;

  @IsOptional()
  @IsString()
  campera_bigNort_talle?: string;

  @IsOptional()
  @IsString()
  pielBigNort_talle?: string;

  @IsOptional()
  @IsString()
  medias_talle?: string;

  @IsOptional()
  @IsString()
  pantalon_termico_bigNort_talle?: string;

  @IsOptional()
  @IsString()
  campera_polar_bigNort_talle?: string;

  @IsOptional()
  @IsString()
  mameluco_talle?: string;
}
