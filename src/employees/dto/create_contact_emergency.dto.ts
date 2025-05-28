import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateContactEmergencyDto {
  @IsString()
  @IsOptional()
  nombre: string;

  @IsString()
  @IsOptional()
  apellido: string;

  @IsOptional()
  @IsString()
  parentesco: string;

  @IsString()
  @IsOptional()
  telefono: string;
}
