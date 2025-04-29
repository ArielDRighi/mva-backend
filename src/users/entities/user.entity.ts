import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../roles/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'usuario_id' })
  id: number;

  @Column({ name: 'empleado_id', nullable: true })
  @Index('idx_usuarios_empleado')
  empleadoId: number;

  @Column({ length: 50, unique: true })
  @Index('idx_usuarios_username')
  nombre: string;

  @Column({ length: 100, unique: true })
  @Index('idx_usuarios_email')
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  password: string;

  @Column({ length: 20, default: 'ACTIVO' })
  estado: string;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
    transformer: {
      from: (value: string[]) => value,
      to: (value: Role[]) => (Array.isArray(value) ? value : [Role.OPERARIO]),
    },
  })
  roles: Role[];

  // Método para comparar contraseñas
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
