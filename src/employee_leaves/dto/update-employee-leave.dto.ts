import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LeaveType } from '../entities/employee-leave.entity';

export class UpdateEmployeeLeaveDto {
  @IsNumber()
  @IsOptional()
  employeeId?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaInicio?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fechaFin?: Date;

  @IsEnum(LeaveType)
  @IsOptional()
  tipoLicencia?: LeaveType;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsBoolean()
  @IsOptional()
  aprobado?: boolean;
  @IsString()
  @IsOptional()
  comentarioRechazo?: string;
}
