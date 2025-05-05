import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDate,
  IsOptional,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  cuit: string;

  @IsString()
  @IsNotEmpty()
  direccion: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsString()
  @IsNotEmpty()
  contacto_principal: string;

  @IsString()
  @IsOptional()
  contacto_principal_telefono: string;

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
  @Type(() => Date)
  fecha_registro?: Date;

  @IsString()
  @IsNotEmpty()
  estado: string;
}
