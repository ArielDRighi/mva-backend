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

  @Column({ name: 'cliente' })
  cliente: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'fecha_del_mantenimiento' })
  fecha_mantenimiento: Date;

  @Column({ name: 'calificacion', type: 'int', nullable: false })
  calificacion: number;

  @Column({ name: 'comentario', type: 'text', nullable: true })
  comentario: string;
  @Column({ name: 'asunto', length: 100, nullable: true })
  asunto: string;

  @Column({ name: 'aspecto_evaluado', length: 100, nullable: true })
  aspecto_evaluado: string;
}
