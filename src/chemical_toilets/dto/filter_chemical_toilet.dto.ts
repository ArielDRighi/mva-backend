import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ResourceState } from 'src/common/enums/resource-states.enum';

export class FilterChemicalToiletDto extends PaginationDto {
  @IsOptional()
  @IsEnum(ResourceState, { each: true })
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
