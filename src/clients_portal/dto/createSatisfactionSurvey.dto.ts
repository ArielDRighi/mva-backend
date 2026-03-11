import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSatisfactionSurveyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(150)
  nombre_empresa: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  lugar_proyecto?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  servicios?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(150)
  contacto?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  medio_contacto: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  tiempo_respuesta: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion_atencion: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion_servicio?: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  accesibilidad_comercial: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  relacion_precio_valor: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  recomendaria: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario_adicional?: string;
}
