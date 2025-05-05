import { IsNotEmpty, IsString } from 'class-validator';

export class CreateContactEmergencyDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsString()
  parentesco: string;

  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  telefono: string;
}
