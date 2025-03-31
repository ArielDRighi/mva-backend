import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateBañosQuimicoDto {
  @IsOptional() // Opcional porque no se actualizará necesariamente
  @IsString()
  codigo_interno?: string;

  @IsOptional() // Opcional porque no se actualizará necesariamente
  @IsString()
  modelo?: string;

  @IsOptional() // Opcional porque no se actualizará necesariamente
  @IsDateString()
  fecha_adquisicion?: Date;

  @IsOptional() // Opcional porque no se actualizará necesariamente
  @IsString()
  estado?: string;
}
