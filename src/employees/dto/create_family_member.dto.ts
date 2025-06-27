import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateFamilyMemberDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @Length(2, 100, {
    message: 'El apellido debe tener entre 2 y 100 caracteres',
  })
  apellido: string;

  @IsString()
  @IsNotEmpty({ message: 'El parentesco es requerido' })
  @Length(2, 50, {
    message: 'El parentesco debe tener entre 2 y 50 caracteres',
  })
  parentesco: string;

  @IsString()
  @IsNotEmpty({ message: 'El DNI es requerido' })
  @Length(5, 20, { message: 'El DNI debe tener entre 5 y 20 caracteres' })
  dni: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: 'La fecha de nacimiento es requerida' })
  fecha_nacimiento: Date;
}
