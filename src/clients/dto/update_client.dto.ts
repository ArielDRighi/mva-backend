import { IsString, IsEmail, IsOptional, IsDate } from 'class-validator';

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cuit?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  contacto_principal?: string;

  @IsString()
  @IsOptional()
  contacto_principal_telefono?: string;

  @IsString()
  @IsOptional()
  contactoObra1?: string;

  @IsString()
  @IsOptional()
  contacto_obra1_telefono?: string;

  @IsString()
  @IsOptional()
  contactoObra2?: string;

  @IsString()
  @IsOptional()
  contacto_obra2_telefono?: string;

  @IsDate()
  @IsOptional()
  fecha_registro?: Date;

  @IsString()
  @IsOptional()
  estado?: string;
}
