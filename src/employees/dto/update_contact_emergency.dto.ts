import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateContactEmergencyDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsString()
  @IsOptional()
  parentesco?: string;

  @IsString()
  @IsOptional()
  telefono?: string;
}
