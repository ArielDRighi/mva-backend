import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateContactEmergencyDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsNotEmpty()
  @IsString()
  parentesco: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsNumber()
  @IsNotEmpty()
  empleado_id: number;
}
