import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateSatisfactionSurveyDto {
  @IsNotEmpty()
  @IsString()
  nombre_empresa: string;

  @IsNotEmpty()
  @IsString()
  lugar_proyecto: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsNotEmpty()
  @IsString()
  medio_contacto: string;

  @IsNotEmpty()
  @IsString()
  tiempo_respuesta: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  calificacion_atencion: number;

  @IsNotEmpty()
  @IsString()
  accesibilidad_comercial: string;

  @IsNotEmpty()
  @IsString()
  relacion_precio_valor: string;

  @IsNotEmpty()
  @IsString()
  recomendaria: string;

  @IsOptional()
  @IsString()
  comentario_adicional?: string;
}
