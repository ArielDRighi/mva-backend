import { IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number;

   // Nuevos filtros
   @IsOptional()
   @IsString()
   nombre?: string;
 
   @IsOptional()
   @IsString()
   cuit?: string;
 
   @IsOptional()
   @IsString()
   email?: string;
}
