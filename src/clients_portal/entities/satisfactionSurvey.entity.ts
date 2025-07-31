import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'satisfaction_survey' })
export class SatisfactionSurvey {
  @PrimaryGeneratedColumn({ name: 'encuesta_id' })
  encuesta_id: number;

  @Column({ name: 'nombre_empresa', length: 150 })
  nombre_empresa: string;

  @Column({ name: 'lugar_proyecto', length: 150 })
  lugar_proyecto: string;

  @Column({ name: 'contacto', length: 150, nullable: true })
  contacto: string;

  @Column({ name: 'medio_contacto', length: 100 })
  medio_contacto: string;

  @Column({ name: 'tiempo_respuesta', length: 50 })
  tiempo_respuesta: string;

  @Column({ name: 'calificacion_atencion', type: 'int' })
  calificacion_atencion: number;

  @Column({ name: 'accesibilidad_comercial', length: 50 })
  accesibilidad_comercial: string;

  @Column({ name: 'relacion_precio_valor', length: 50 })
  relacion_precio_valor: string;

  @Column({ name: 'recomendaria', length: 50 })
  recomendaria: string;

  @Column({ name: 'comentario_adicional', type: 'text', nullable: true })
  comentario_adicional: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
