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
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      }
      throw new UnauthorizedException('Token inválido');
    }
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    const user = await this.usersService.findByUsername(username);
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    if (user.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const payload = {
      sub: user.id,
      nombre: user.nombre,
      email: user.email,
      roles: user.roles || [],
    };

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
}
