import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '../../roles/enums/role.enum';

interface JwtPayload {
  sub: number;
  nombre: string;
  email: string;
  empleadoId: number;
  roles: Role[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private configService: ConfigService) {
    const secret = configService.getOrThrow<string>('jwt.secret');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });

    this.logger.log('JWT Strategy initialized');
  }

  validate(payload: JwtPayload) {
    this.logger.debug(`JWT Payload: ${JSON.stringify(payload)}`);

    // Verificar que el payload tiene los campos necesarios
    if (!payload || !payload.sub) {
      this.logger.error('Invalid JWT payload');
      throw new UnauthorizedException('Invalid token');
    }

    // Verificar que el token tiene roles
    if (!payload.roles || !Array.isArray(payload.roles)) {
      this.logger.warn(`JWT has no roles: ${JSON.stringify(payload)}`);
      payload.roles = []; // Establecer un array vacío si no hay roles
    }

    const user = {
      userId: payload.sub,
      username: payload.nombre,
      email: payload.email,
      roles: Array.isArray(payload.roles) ? payload.roles : [],
      empleadoId: payload.empleadoId,
    };

    this.logger.debug(`JWT validated successfully for user: ${user.username}`);
    return user;
  }
}
