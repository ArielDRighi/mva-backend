import { IsString, IsEmail, IsOptional, IsDate } from 'class-validator';

export class UpdateClientDto {
  @IsString()
  @IsOptional()  // Opcional, solo se actualizará si se pasa
  nombre?: string;

  @IsEmail()
  @IsOptional()  // Opcional
  email?: string;

  @IsString()
  @IsOptional()  // Opcional
  cuit?: string;

  @IsString()
  @IsOptional()  // Opcional
  direccion?: string;

  @IsString()
  @IsOptional()  // Opcional
  telefono?: string;

  @IsString()
  @IsOptional()  // Opcional
  contacto_principal?: string;

  @IsDate()
  @IsOptional()  // Opcional
  fecha_registro?: Date;

  @IsString()
  @IsOptional()  // Opcional
  estado?: string;
}
