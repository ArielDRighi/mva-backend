import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
} from './dto/login.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  validateToken(token: string): any {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.usersService.findByEmail(email);
    console.log('Usuario encontrado:', user);
    console.log('Contraseña proporcionada:', password);
    // Si no se encuentra el usuario o la contraseña es incorrecta, lanzar excepción
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si el usuario está activo
    if (user.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo');
    }
    // Crear payload para el token JWT
    const payload = {
      sub: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: user.roles || [],
      empleadoId: user.empleadoId,
    };

    // Retornar token y datos del usuario
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        empleadoId: user.empleadoId,
        estado: user.estado,
        roles: user.roles || [],
      },
    };
  }

  async forgotPassword(emailDto: ForgotPasswordDto) {
    const { email } = emailDto;

    // 1. Buscar el usuario por email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // 2. Generar una nueva contraseña
    const newPassword = this.generateRandomPassword();

    // 3. Actualizar el password en base de datos
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    // 4. Devolver el objeto esperado por el interceptor
    return {
      user: {
        email: user.email,
        nombre: user.nombre, // o name
        newPassword, // nueva contraseña generada
      },
    };
  }

  async resetPassword(data: ChangePasswordDto, userId: number) {
    const { oldPassword, newPassword } = data;

    // 1. Buscar el usuario por id
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    console.log('user', user);
    console.log('oldPassword', oldPassword);
    console.log('user.password', user.password);
    console.log('newPassword', newPassword);

    // 2. Verificar que la contraseña vieja coincida
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Contraseña anterior incorrecta');
    }

    // 3. Actualizar con la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedNewPassword);

    // 4. Devolver el objeto esperado por el interceptor
    return {
      user: {
        email: user.email,
        nombre: user.nombre,
        newPassword, // en este caso, el que envió el cliente
      },
    };
  }

  private generateRandomPassword(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return password;
  }
}
