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

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  fecha_registro?: Date;

  @IsString()
  @IsNotEmpty()
  estado: string;
}
