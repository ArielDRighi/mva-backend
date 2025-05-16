import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRopaTallesDto {
  @IsNotEmpty()
  @IsString()
  calzado_talle: string;

  @IsNotEmpty()
  @IsString()
  pantalon_talle: string;

  @IsNotEmpty()
  @IsString()
  camisa_talle: string;

  @IsNotEmpty()
  @IsString()
  campera_bigNort_talle: string;

  @IsNotEmpty()
  @IsString()
  pielBigNort_talle: string;

  @IsNotEmpty()
  @IsString()
  medias_talle: string;

  @IsNotEmpty()
  @IsString()
  pantalon_termico_bigNort_talle: string;

  @IsNotEmpty()
  @IsString()
  campera_polar_bigNort_talle: string;

  @IsNotEmpty()
  @IsString()
  mameluco_talle: string;
}
