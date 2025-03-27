import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';

@Entity('usuarios')
export class User {
  @ApiProperty({
    description: 'ID único del usuario',
    example: 1,
  })
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  id: number;

  @ApiProperty({
    description: 'ID del empleado asociado',
    example: 1001,
    required: false,
  })
  @Column({ name: 'empleado_id', nullable: true })
  @Index('idx_usuarios_empleado')
  empleadoId: number;

  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'john.doe',
  })
  @Column({ length: 50, unique: true })
  @Index('idx_usuarios_username')
  username: string;

  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'john.doe@example.com',
  })
  @Column({ length: 100, unique: true })
  @Index('idx_usuarios_email')
  email: string;

  @ApiProperty({
    description: 'Contraseña encriptada del usuario',
    example: '$2b$10$X9nYUQf0KCJJ4O0K7n5L8eY5Z6y1VH3YNpTR7Gp7sY4Y3x3Z2qZ2q',
  })
  @Column({ name: 'password_hash', length: 255 })
  password: string;

  @ApiProperty({
    description: 'Estado actual del usuario',
    example: 'ACTIVO',
    enum: ['ACTIVO', 'INACTIVO'],
  })
  @Column({ length: 20, default: 'ACTIVO' })
  estado: string;

  // Método para comparar contraseñas
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
