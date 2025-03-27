import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';

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
      username: user.username,
      email: user.email,
    };

    // Retornar token y datos del usuario
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        empleadoId: user.empleadoId,
        estado: user.estado,
      },
    };
  }
}
