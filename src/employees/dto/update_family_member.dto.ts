import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, Length } from 'class-validator';

export class UpdateFamilyMemberDto {
  @IsString()
  @IsOptional()
  @Length(2, 100, {
    message: 'El nombre debe tener entre 2 y 100 caracteres',
  })
  nombre?: string;

  @IsString()
  @IsOptional()
  @Length(2, 100, {
    message: 'El apellido debe tener entre 2 y 100 caracteres',
  })
  apellido?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50, {
    message: 'El parentesco debe tener entre 2 y 50 caracteres',
  })
  parentesco?: string;

  @IsString()
  @IsOptional()
  @Length(5, 20, {
    message: 'El DNI debe tener entre 5 y 20 caracteres',
  })
  dni?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fecha_nacimiento?: Date;
}
