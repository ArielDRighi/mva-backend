import {
  IsString,
  IsDateString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ResourceState } from 'src/common/enums/resource-states.enum';

export class CreateChemicalToiletDto {
  @IsNotEmpty()
  @IsString()
  codigo_interno: string;
  @IsNotEmpty()
  @IsString()
  modelo: string;
  @IsNotEmpty()
  @IsDateString()
  fecha_adquisicion: Date;
  @IsOptional()
  @IsEnum(ResourceState)
  estado: ResourceState;
}
