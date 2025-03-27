import { IsString, IsEmail, IsNotEmpty, IsDate, IsOptional } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  cuit: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  mainContact: string;

  @IsDate()
  @IsOptional()  // Opcional si no quieres que lo proporcionen al crear
  registrationDate?: Date;

  @IsString()
  @IsNotEmpty()
  status: string;
}
