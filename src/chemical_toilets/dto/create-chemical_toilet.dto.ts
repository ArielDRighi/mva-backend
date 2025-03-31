import { IsString, IsDateString } from 'class-validator';

export class CreateChemicalToiletDto {
  @IsString()
  codigo_interno: string;

  @IsString()
  modelo: string;

  @IsDateString()
  fecha_adquisicion: Date;

  @IsString()
  estado: string;
}
