# Documentación del Módulo de Roles (MVA Backend)

## Índice

1. Introducción
2. Roles Disponibles
3. Implementación de Roles
   - 1. Decorador de Roles
   - 2. Guard de Roles
4. Implementación en Controladores
5. Ejemplos de Uso
6. Manejo de Errores
7. Logging y Depuración

## 1. Introducción

El módulo de Roles proporciona un sistema básico para controlar el acceso a diferentes funcionalidades del sistema basado en roles predefinidos. Cada usuario tiene asignado uno o varios roles que determinan qué acciones puede realizar dentro del sistema.

## 2. Roles Disponibles

El sistema implementa cuatro roles básicos predefinidos:

| Rol        | Descripción                                               |
| ---------- | --------------------------------------------------------- |
| ADMIN      | Administrador con acceso completo al sistema              |
| SUPERVISOR | Acceso a funciones de gestión y supervisión               |
| OPERARIO   | Acceso limitado a funciones operativas diarias            |
| CLIENTE    | Acceso exclusivo a funcionalidades del portal de clientes |

Estos roles están definidos en el enum `Role`:

```typescript
// src/roles/enums/role.enum.ts
export enum Role {
  ADMIN = 'ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  OPERARIO = 'OPERARIO',
  CLIENTE = 'CLIENTE',
}
```

## 3. Implementación de Roles

### 1. Decorador de Roles

El sistema utiliza un decorador personalizado `@Roles()` para especificar qué roles tienen acceso a cada endpoint:

```typescript
// src/roles/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

Este decorador establece metadatos en los controladores o métodos de controlador, que luego son utilizados por el guard de roles.

### 2. Guard de Roles

El `RolesGuard` es responsable de verificar si el usuario actual tiene los roles necesarios para acceder a un recurso específico:

```typescript
// src/roles/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorador
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles) {
      return true;
    }

    // Obtener el usuario del request
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { roles?: Role[] } }>();
    const user = request.user;

    // Registro detallado para depuración
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
```

## 4. Implementación en Controladores

Para proteger un endpoint con roles específicos, se utilizan los guards `JwtAuthGuard` y `RolesGuard` junto con el decorador `@Roles()`:

```typescript
@Controller('example')
export class ExampleController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Get()
  findAll() {
    // Este endpoint solo es accesible para usuarios con rol ADMIN o SUPERVISOR
    return { message: 'Acceso permitido' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create() {
    // Este endpoint solo es accesible para usuarios con rol ADMIN
    return { message: 'Recurso creado' };
  }
}
```

## 5. Ejemplos de Uso

### Asegurar un controlador completo

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin-only')
export class AdminOnlyController {
  @Get()
  findAll() {
    // Accesible solo para ADMIN
  }

  @Post()
  create() {
    // Accesible solo para ADMIN
  }
}
```

### Asegurar endpoints individuales con diferentes roles

```typescript
@Controller('resources')
export class ResourcesController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.OPERARIO)
  @Get()
  findAll() {
    // Accesible para ADMIN, SUPERVISOR y OPERARIO
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @Post()
  create() {
    // Accesible solo para ADMIN y SUPERVISOR
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove() {
    // Accesible solo para ADMIN
  }
}
```

## 6. Manejo de Errores

El módulo de roles incluye un manejo de errores robusto que proporciona mensajes claros cuando se produce un error de autorización.

### Acceso denegado por rol insuficiente

Cuando un usuario intenta acceder a un recurso para el cual no tiene el rol adecuado:

**Respuesta de Error (403 Forbidden):**

```json
{
  "message": "No tiene permisos para realizar esta acción",
  "error": "Forbidden",
  "statusCode": 403
}
```

### Usuario sin roles definidos

Si el sistema no puede determinar los roles de un usuario autenticado o el array de roles no es válido:

**Respuesta de Error (403 Forbidden):**

```json
{
  "message": "User has no roles",
  "error": "Forbidden",
  "statusCode": 403
}
```

### Usuario no autenticado

Si el usuario no está autenticado o el token es inválido:

**Respuesta de Error (403 Forbidden):**

```json
{
  "message": "Not authenticated",
  "error": "Forbidden",
  "statusCode": 403
}
```

## 7. Logging y Depuración

El módulo implementa un sistema de logging detallado para facilitar la depuración de problemas relacionados con la autorización:

### Niveles de log

- **DEBUG**: Información detallada sobre el usuario que intenta acceder, los roles requeridos y el resultado de la verificación.
- **ERROR**: Registra errores cuando el objeto de usuario no existe o cuando no tiene roles válidos.

### Ejemplos de logs

```
[RolesGuard] DEBUG User object: {"id":1,"email":"admin@example.com","roles":["ADMIN"]}
[RolesGuard] DEBUG Required roles: ["ADMIN","SUPERVISOR"]
[RolesGuard] DEBUG Has required role: true
```

```
[RolesGuard] ERROR User has no roles or roles is not an array: undefined
```

### Uso en depuración

El sistema de logging es especialmente útil para diagnosticar problemas cuando:

1. Un usuario no puede acceder a un recurso a pesar de creer tener los permisos correctos.
2. Se producen errores inesperados en el proceso de autorización.
3. Se necesita realizar un seguimiento de quién accede a qué recursos y con qué roles.

Para habilitar los logs de depuración, ajusta el nivel de log en el archivo de configuración de la aplicación o en el archivo `.env`:

```
LOG_LEVEL=debug
```
