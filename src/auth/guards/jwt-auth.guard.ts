import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  handleRequest<T = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): T {
    this.logger.debug(`JWT Auth Guard - Error: ${JSON.stringify(err)}`);
    this.logger.debug(`JWT Auth Guard - User: ${JSON.stringify(user)}`);
    this.logger.debug(`JWT Auth Guard - Info: ${JSON.stringify(info)}`);

    // Si hay error o no hay usuario, AuthGuard lanzará una excepción
    if (err || !user) {
      this.logger.error(
        `JWT Auth Guard - Authentication failed: ${err && typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'No user found'}`,
      );
    } else {
      this.logger.debug('JWT Auth Guard - Authentication successful');
    }

    return super.handleRequest(err, user, info, context);
  }
}
