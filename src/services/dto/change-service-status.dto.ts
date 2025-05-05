import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ServiceState } from '../../common/enums/resource-states.enum';

export class ChangeServiceStatusDto {
  @IsEnum(ServiceState)
  estado: ServiceState;

  @IsOptional()
  @IsBoolean()
  forzar?: boolean;

  @ValidateIf(
    (o: ChangeServiceStatusDto) => o.estado === ServiceState.INCOMPLETO,
  )
  @IsString()
  comentarioIncompleto?: string;
}
