import { IsString, IsEmail, IsOptional, IsDate } from 'class-validator';

export class UpdateClientDto {
  @IsString()
  @IsOptional()  // Opcional, solo se actualizará si se pasa
  name?: string;

  @IsEmail()
  @IsOptional()  // Opcional
  email?: string;

  @IsString()
  @IsOptional()  // Opcional
  cuit?: string;

  @IsString()
  @IsOptional()  // Opcional
  address?: string;

  @IsString()
  @IsOptional()  // Opcional
  phone?: string;

  @IsString()
  @IsOptional()  // Opcional
  mainContact?: string;

  @IsDate()
  @IsOptional()  // Opcional
  registrationDate?: Date;

  @IsString()
  @IsOptional()  // Opcional
  status?: string;
}
