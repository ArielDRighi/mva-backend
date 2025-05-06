import { IsOptional, IsString } from 'class-validator';

export class UpdateLicenseDto {
  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  fecha_expedicion?: Date;

  @IsOptional()
  fecha_vencimiento?: Date;
}
