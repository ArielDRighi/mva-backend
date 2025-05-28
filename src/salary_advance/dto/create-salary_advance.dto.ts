import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateAdvanceDto {
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @IsNotEmpty({ message: 'La cantidad es requerida' })
  amount: number;

  @IsString({ message: 'La razón debe ser un texto' })
  @IsNotEmpty({ message: 'La razón es requerida' })
  reason: string;

  @IsOptional()
  @Transform(({ value }) => {
    // Este ejemplo permite transformaciones adicionales si es necesario
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  status: string = 'pending'; // Valor por defecto es 'pending'
}
