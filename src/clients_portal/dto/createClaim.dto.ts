import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { PrioridadReclamo, TipoReclamo } from '../entities/claim.entity';

export class CreateClaimDto {
  @IsString()
  @Length(1, 255)
  cliente: string;

  @IsString()
  @Length(5, 150)
  titulo: string;

  @IsString()
  descripcion: string;

  @IsEnum(TipoReclamo)
  @IsOptional()
  tipoReclamo: TipoReclamo = TipoReclamo.OTROS;

  @IsEnum(PrioridadReclamo)
  @IsOptional()
  prioridad: PrioridadReclamo = PrioridadReclamo.MEDIA;

  @IsDateString()
  fechaIncidente: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  adjuntosUrls?: string[]; // corregido

  @IsBoolean()
  @IsOptional()
  esUrgente?: boolean = false;

  @IsBoolean()
  @IsOptional()
  requiereCompensacion?: boolean = false;

  @IsString()
  @IsOptional()
  compensacionDetalles?: string;

  @IsString()
  @IsOptional()
  notasInternas?: string; // corregido

  @IsString()
  @IsOptional()
  empleadoAsignado?: string; // esto también debe existir en la entidad si querés guardarlo
}
