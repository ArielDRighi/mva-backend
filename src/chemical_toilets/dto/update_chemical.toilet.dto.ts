import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ResourceState } from 'src/common/enums/resource-states.enum';

export class UpdateChemicalToiletDto {
  @IsOptional()
  @IsString()
  codigo_interno?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsDateString()
  fecha_adquisicion?: Date;

  @IsOptional()
  @IsEnum(ResourceState, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.replace(/\s+/g, '_').toUpperCase();
    }
    return value;
  })
  estado?: ResourceState;
}
