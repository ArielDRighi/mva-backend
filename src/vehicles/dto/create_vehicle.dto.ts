import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty({ message: 'La placa del vehículo es requerida' })
  placa: string;

  @IsString()
  @IsNotEmpty({ message: 'La marca del vehículo es requerida' })
  marca: string;

  @IsString()
  @IsNotEmpty({ message: 'El modelo del vehículo es requerido' })
  modelo: string;

  @IsNumber()
  @Min(1900, { message: 'El año debe ser válido' })
  anio: number;

  @IsNumber()
  @Min(0, { message: 'La capacidad de carga debe ser mayor o igual a cero' })
  capacidadCarga: number;

  @IsString()
  estado: string = 'ACTIVO';
}
