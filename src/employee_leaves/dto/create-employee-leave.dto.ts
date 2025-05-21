import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { LeaveType } from '../entities/employee-leave.entity';

export class CreateEmployeeLeaveDto {
  @IsNumber()
  @IsNotEmpty()
  employeeId: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  fechaInicio: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  fechaFin: Date;

  @IsEnum(LeaveType)
  @IsNotEmpty()
  tipoLicencia: LeaveType;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsOptional()
  status?: string;
}
