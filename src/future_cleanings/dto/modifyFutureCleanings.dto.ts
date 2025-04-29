import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ModifyFutureCleaningDto {
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}
