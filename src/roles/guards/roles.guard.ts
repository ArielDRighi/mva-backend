import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No hay roles requeridos, permitir acceso
    }
    // Obtener el objeto request
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { roles?: Role[] } }>();

    // Obtener el usuario del request (provisto por JwtAuthGuard)
    const user = request.user;

    this.logger.debug(`User object: ${JSON.stringify(user)}`);
    this.logger.debug(`Required roles: ${JSON.stringify(requiredRoles)}`);

    // Verificar si el usuario existe
    if (!user) {
      this.logger.error('User object is undefined');
      throw new ForbiddenException('Not authenticated');
    }

    // Verificar si el usuario tiene roles
    if (!user.roles || !Array.isArray(user.roles)) {
      this.logger.error(
        `User has no roles or roles is not an array: ${JSON.stringify(user.roles)}`,
      );
      throw new ForbiddenException('User has no roles');
    }

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles?.includes(role),
    );

    this.logger.debug(`Has required role: ${hasRequiredRole}`);

    // Si no tiene el rol requerido, lanzar excepción
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta acción',
      );
    }

    return true;
  }
}
