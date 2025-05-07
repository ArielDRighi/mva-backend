# Documentación de la API de Autenticación (MVA Backend)

## Índice

1. Introducción
2. Endpoints de Autenticación
   - 1. Login de Usuario
   - 2. Solicitud de Restablecimiento de Contraseña
   - 3. Cambio de Contraseña
3. Autenticación con JWT
4. Roles y Permisos
5. Seguridad y Consideraciones
6. Estrategias de Autenticación
7. Ejemplos de Uso
8. Manejo de Errores

## 1. Introducción

La API de Autenticación permite gestionar el acceso de usuarios al sistema MVA Backend. Esta documentación describe los endpoints disponibles, las estrategias de autenticación implementadas, y cómo funciona el sistema de roles y permisos.

## 2. Endpoints de Autenticación

### 1. Login de Usuario

**Endpoint:** `POST /api/auth/login`  
**Descripción:** Autentica a un usuario y retorna un token JWT válido.

**Request Body:**

```json
{
  "username": "usuario@ejemplo.com",
  "password": "contraseña_segura"
}
```

| Campo    | Tipo   | Requerido | Descripción               | Validación              |
| -------- | ------ | --------- | ------------------------- | ----------------------- |
| username | string | Sí        | Email o nombre de usuario | Email válido o username |
| password | string | Sí        | Contraseña del usuario    | Mínimo 8 caracteres     |

**Respuesta Exitosa (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "usuario@ejemplo.com",
    "nombre": "Nombre Usuario",
    "rol": "ADMIN"
  }
}
```

**Respuesta de Error (401 Unauthorized):**

```json
{
  "message": "Credenciales inválidas",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### 2. Solicitud de Restablecimiento de Contraseña

**Endpoint:** `PUT /api/auth/forgot_password`  
**Descripción:** Permite solicitar el restablecimiento de contraseña mediante correo electrónico.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com"
}
```

| Campo | Tipo   | Requerido | Descripción                   | Validación   |
| ----- | ------ | --------- | ----------------------------- | ------------ |
| email | string | Sí        | Email del usuario a recuperar | Email válido |

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña"
}
```

**Respuesta de Error (401 Unauthorized):**

```json
{
  "message": "Error al restablecer la contraseña",
  "error": "Unauthorized",
  "statusCode": 401
}
```

**Nota:** Este endpoint utiliza el módulo de Mailer para enviar las instrucciones de restablecimiento de contraseña al correo electrónico proporcionado.

### 3. Cambio de Contraseña

**Endpoint:** `PUT /api/auth/change_password`  
**Roles permitidos:** ADMIN, SUPERVISOR, CLIENTE, OPERARIO (usuario autenticado)  
**Descripción:** Permite al usuario cambiar su contraseña.

**Request Headers:**

```
Authorization: Bearer {token_jwt}
```

**Request Body:**

```json
{
  "oldPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

| Campo       | Tipo   | Requerido | Descripción       | Validación              |
| ----------- | ------ | --------- | ----------------- | ----------------------- |
| oldPassword | string | Sí        | Contraseña actual | Debe ser correcta       |
| newPassword | string | Sí        | Nueva contraseña  | Entre 8 y 20 caracteres |

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Respuesta de Error (401 Unauthorized):**

```json
{
  "message": "Error al restablecer la contraseña",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## 3. Autenticación con JWT

El sistema utiliza JSON Web Tokens (JWT) para la autenticación. Cada token contiene:

- **Header:** Algoritmo y tipo de token
- **Payload:** Información del usuario (id, username, rol), fecha de emisión y expiración
- **Signature:** Firma para validar la autenticidad del token

### Ciclo de vida del token

1. El usuario se autentica con credenciales válidas
2. El servidor genera un token JWT firmado
3. El cliente almacena este token (típicamente en localStorage)
4. El cliente incluye el token en el encabezado Authorization en cada solicitud
5. El servidor valida el token en cada solicitud protegida
6. El token expira después de un tiempo determinado (configurado en jwt.config.ts)

### Configuración JWT

La configuración del token JWT se encuentra en `src/config/jwt.config.ts` y puede incluir:

- Tiempo de expiración
- Secreto para firma
- Algoritmo de firma

## 4. Roles y Permisos

El sistema implementa un modelo basado en roles (RBAC) con los siguientes roles principales:

| Rol        | Descripción                                  | Permisos                                    |
| ---------- | -------------------------------------------- | ------------------------------------------- |
| ADMIN      | Administrador con acceso completo al sistema | Acceso total a todas las funcionalidades    |
| SUPERVISOR | Supervisor con acceso a gestión operativa    | Gestión de servicios, empleados y reportes  |
| OPERADOR   | Personal operativo con acceso limitado       | Registro de actividades y consultas básicas |
| CLIENTE    | Usuario del portal de clientes               | Acceso al portal de clientes únicamente     |

### Implementación de Guards

Los permisos se implementan mediante Guards en NestJS:

1. **JwtAuthGuard**: Verifica que el token JWT sea válido
2. **RolesGuard**: Verifica que el usuario tenga el rol requerido para acceder a un recurso

Ejemplo de uso en controladores:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERVISOR')
@Post()
createResource(@Body() createDto: CreateDto) {
  // Lógica para crear recurso
}
```

## 5. Seguridad y Consideraciones

### Almacenamiento seguro de contraseñas

Las contraseñas se almacenan utilizando algoritmos de hash seguros (bcrypt) con salt aleatorio.

### Protección contra ataques comunes

El sistema implementa protecciones contra:

1. **Ataques de fuerza bruta**: Limitación de intentos de login
2. **CSRF**: Uso de tokens específicos para formularios
3. **XSS**: Sanitización de datos de entrada y salida
4. **Inyección SQL**: Uso de ORM con parámetros parametrizados

### Recomendaciones de seguridad

1. Utilizar HTTPS en producción
2. Renovar tokens periódicamente
3. Implementar autenticación de dos factores para roles críticos
4. Monitorear intentos de acceso fallidos

## 6. Estrategias de Autenticación

El módulo de autenticación implementa varias estrategias:

### Local Strategy

Utilizada para la autenticación con username/password:

```typescript
// src/auth/strategies/local.strategy.ts
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```

### JWT Strategy

Utilizada para validar tokens JWT en solicitudes:

```typescript
// src/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
```

## 7. Ejemplos de Uso

### Flujo de autenticación básico

1. **Login y obtención de token**

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin@mva.com",
  "password": "AdminPass2025"
}
```

2. **Uso del token para acceder a recursos protegidos**

```http
GET /api/clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Flujo de restablecimiento de contraseña

1. **Solicitar restablecimiento**

```http
PUT /api/auth/forgot_password
Content-Type: application/json

{
  "email": "usuario@mva.com"
}
```

2. **Cambiar contraseña (usuario ya autenticado)**

```http
PUT /api/auth/change_password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "oldPassword": "contraseña_actual",
  "newPassword": "nueva_contraseña"
}
```

**Nota:** La creación de nuevos usuarios se gestiona a través del módulo de Usuarios, no del módulo de Autenticación. Consulte la documentación de usuarios para más información sobre cómo crear nuevos usuarios en el sistema.

## 8. Manejo de Errores

### Credenciales inválidas

**Respuesta de Error (401 Unauthorized):**

```json
{
  "message": "Credenciales inválidas",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Token expirado o inválido

**Respuesta de Error (401 Unauthorized):**

```json
{
  "message": "Unauthorized",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### Acceso denegado por rol insuficiente

**Respuesta de Error (403 Forbidden):**

```json
{
  "message": "User does not have required roles",
  "error": "Forbidden",
  "statusCode": 403
}
```

### Usuario ya existe (en registro)

**Respuesta de Error (409 Conflict):**

```json
{
  "message": "Username already exists",
  "error": "Conflict",
  "statusCode": 409
}
```

### Error de validación en datos de entrada

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": [
    "username must be a valid email",
    "password must be at least 8 characters long"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
