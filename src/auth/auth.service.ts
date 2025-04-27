import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
} from './dto/login.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';

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
    const { username, password } = loginDto;

    // Buscar usuario por username
    const user = await this.usersService.findByUsername(username);

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

  async forgotPassword(email: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(email.email);
    if (!user) {
      throw new BadRequestException('El correo electrónico no está registrado');
    }
    const newPassword = this.generateRandomPassword();
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    await this.usersService.updatePassword(user.id, passwordHash);
    try {
      const name = user.nombre;

      user['newPassword'] = newPassword;
    } catch (error) {
      throw new BadRequestException('Error al enviar el correo electrónico');
    }
    return {
      success: true,
      message: 'Se ha enviado un correo electrónico con la nueva contraseña',
      user,
    };
  }

  private generateRandomPassword(length = 12): string {
    const uppercaseChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin I, O para evitar confusiones
    const lowercaseChars = 'abcdefghijkmnopqrstuvwxyz'; // Sin l para evitar confusiones
    const numberChars = '23456789'; // Sin 0, 1 para evitar confusiones
    const specialChars = '!@#$%^&*_-+=';

    const allChars =
      uppercaseChars + lowercaseChars + numberChars + specialChars;

    // Asegura que la contraseña tenga al menos un carácter de cada tipo
    let password =
      uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length)) +
      lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length)) +
      numberChars.charAt(Math.floor(Math.random() * numberChars.length)) +
      specialChars.charAt(Math.floor(Math.random() * specialChars.length));

    // Completa el resto de la contraseña
    for (let i = 4; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Mezcla los caracteres para evitar un patrón predecible
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  async resetPassword(data: ChangePasswordDto, userId: any) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }
    const isPasswordValid = await user.comparePassword(data.oldPassword);
    if (!isPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.newPassword, saltRounds);
    await this.usersService.updatePassword(userId, passwordHash);
    return {
      success: true,
      message: 'Contraseña actualizada correctamente',
    };
  }
}
