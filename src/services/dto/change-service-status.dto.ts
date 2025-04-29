import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ServiceState } from '../../common/enums/resource-states.enum';

export class ChangeServiceStatusDto {
  @IsEnum(ServiceState)
  estado: ServiceState;

  @IsOptional()
  @IsBoolean()
  forzar?: boolean;
}
