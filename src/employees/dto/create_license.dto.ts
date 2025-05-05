import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLicenseDto {
  @IsNotEmpty()
  @IsString()
  categoria: string;

  @IsNotEmpty()
  fecha_expedicion: Date;

  @IsNotEmpty()
  fecha_vencimiento: Date;
}
