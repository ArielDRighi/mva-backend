import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ResourceState } from 'src/common/enums/resource-states.enum';

export class FilterChemicalToiletDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ResourceState, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.replace(/\s+/g, '_').toUpperCase();
    }
    return value;
  })
  estado?: ResourceState;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsString()
  codigoInterno?: string;
}
