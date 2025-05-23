import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EstadoReclamo {
  PENDIENTE = 'pending',
  EN_PROGRESO = 'in_progress',
  RESUELTO = 'resolved',
  CERRADO = 'closed',
  RECHAZADO = 'rejected',
}

export enum PrioridadReclamo {
  BAJA = 'low',
  MEDIA = 'medium',
  ALTA = 'high',
  CRITICA = 'critical',
}

export enum TipoReclamo {
  CALIDAD_SERVICIO = 'service_quality',
  DEMORA = 'delay',
  PAGOS = 'billing',
  EMPLEADO = 'staff_behavior',
  PRODUCTO_DEFECTUOSO = 'product_defect',
  OTROS = 'other',
}
@Entity({ name: 'claims' })
export class Claim {
  @PrimaryGeneratedColumn({ name: 'reclamo_id' })
  reclamo_id: number;

  @Column({ name: 'cliente' })
  cliente: string;

  @Column({ name: 'titulo', length: 150 })
  titulo: string;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({
    name: 'tipo_reclamo',
    type: 'enum',
    enum: TipoReclamo,
    default: TipoReclamo.OTROS,
  })
  tipoReclamo: TipoReclamo;

  @Column({
    name: 'prioridad',
    type: 'enum',
    enum: PrioridadReclamo,
    default: PrioridadReclamo.MEDIA,
  })
  prioridad: PrioridadReclamo;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: EstadoReclamo,
    default: EstadoReclamo.PENDIENTE,
  })
  estado: EstadoReclamo;

  @CreateDateColumn({ name: 'fecha_creacion' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_incidente', type: 'date', nullable: false })
  fechaIncidente: Date;

  @UpdateDateColumn({ name: 'fecha_actualizacion' })
  fechaActualiacion: Date;

  @Column({ name: 'fecha_resolucion', type: 'date', nullable: true })
  fechaResolucion: Date;

  @Column({ name: 'respuesta', type: 'text', nullable: true })
  respuesta: string;

  @Column({ name: 'accion_tomada', type: 'text', nullable: true })
  accionTomada: string;

  @Column({ name: 'adjuntos_urls', type: 'simple-array', nullable: true })
  adjuntosUrls: string[]; // URLs de documentos o imágenes adjuntas

  @Column({ name: 'satisfaccion_cliente', type: 'int', nullable: true })
  satisfaccionCliente: number; // Calificación del cliente sobre la resolución

  @Column({ name: 'es_urgente', type: 'boolean', default: false })
  esUrgente: boolean;

  @Column({ name: 'requiere_compensacion', type: 'boolean', default: false })
  requiereCompensacion: boolean;

  @Column({ name: 'compensacion_detalles', type: 'text', nullable: true })
  compensacionDetalles: string;

  @Column({ name: 'notas_internas', type: 'text', nullable: true })
  notasInternas: string; // Notas visibles solo para personal interno

  @Column({ name: 'empleado_asignado', type: 'text', nullable: true })
  empleadoAsignado: string;
}
