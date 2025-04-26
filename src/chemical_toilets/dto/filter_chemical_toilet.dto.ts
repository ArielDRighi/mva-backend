import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class FilterChemicalToiletDto  extends PaginationDto {
  @IsOptional()
  @IsString()
  estado?: string;

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
