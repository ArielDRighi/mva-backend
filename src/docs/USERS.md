# Documentación de Usuarios, Autenticación y Control de Acceso (MVA Backend)

## Índice

1. Introducción
2. Usuarios y Roles
   - Tipos de Roles
   - Estructura de Usuario
3. Autenticación
   - Obtención de Token JWT
   - Estructura del Token
   - Validación del Token
4. Autorización
   - Protección de Rutas
   - Control de Acceso Basado en Roles
5. Gestión de Usuarios
   - Creación de Usuario
   - Obtener Usuarios
   - Actualización de Usuario
   - Cambiar Contraseña
   - Cambiar Estado
   - Eliminar Usuario
6. Usuario Administrador Inicial
7. Flujos de Autenticación Completos
8. Integración con Postman
9. Solución de Problemas
10. Mejores Prácticas

## 1. Introducción

El sistema MVA Backend utiliza un sistema de autenticación basado en JWT (JSON Web Tokens) con control de acceso basado en roles (RBAC). Este documento detalla cómo funciona la autenticación, autorización y la gestión de usuarios dentro de la plataforma.

## 2. Usuarios y Roles

### Tipos de Roles

El sistema incluye los siguientes roles predefinidos:

- **ADMIN**: Acceso completo a todas las funcionalidades del sistema
- **SUPERVISOR**: Acceso a la mayoría de funciones administrativas sin acceso a funciones críticas
- **OPERARIO**: Acceso limitado a operaciones básicas como registrar trabajos y mantenimientos

### Estructura de Usuario

La entidad Usuario contiene los siguientes campos principales:

```typescript
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  estado: string; // ACTIVO, INACTIVO

  @Column('simple-array')
  roles: string[];

  @Column({ nullable: true })
  empleadoId: number;

  @ManyToOne(() => Empleado, { nullable: true })
  @JoinColumn({ name: 'empleadoId' })
  empleado: Empleado;
}
```

## 3. Autenticación

### Obtención de Token JWT

Para acceder al sistema, los usuarios deben obtener un token JWT mediante el endpoint de login:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

#### Respuesta Exitosa (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "admin",
    "email": "admin@mva.com",
    "empleadoId": null,
    "estado": "ACTIVO",
    "roles": ["ADMIN"]
  }
}
```

### Estructura del Token

El token JWT contiene la siguiente información en su payload:

```json
{
  "sub": 1, // ID del usuario
  "nombre": "admin", // Nombre del usuario
  "email": "admin@mva.com", // Email del usuario
  "roles": ["ADMIN"], // Roles asignados
  "iat": 1619099086, // Fecha de emisión
  "exp": 1619128886 // Fecha de expiración
}
```

### Validación del Token

Para realizar solicitudes autenticadas, incluir el token en el encabezado HTTP:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Autorización

### Protección de Rutas

Todas las rutas en el sistema (excepto login) están protegidas por el guard `JwtAuthGuard`, que verifica la validez del token JWT proporcionado.

```typescript
@Controller('resource')
@UseGuards(JwtAuthGuard)
export class ResourceController {
  // ...métodos del controlador
}
```

### Control de Acceso Basado en Roles

Las rutas que requieren roles específicos utilizan el guard `RolesGuard` junto con el decorator `@Roles()`:

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    // Solo accesible para roles ADMIN
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  create() {
    // Accesible para ADMIN y SUPERVISOR
  }
}
```

## 5. Gestión de Usuarios

### Creación de Usuario

**Endpoint:** `POST /api/users`  
**Roles permitidos:** ADMIN

```http
POST /api/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "nuevo_usuario",
  "email": "usuario@mva.com",
  "password": "contraseña123",
  "roles": ["SUPERVISOR"],
  "empleadoId": 5
}
```

| Campo      | Tipo     | Requerido | Descripción                                            | Validación                      |
| ---------- | -------- | --------- | ------------------------------------------------------ | ------------------------------- |
| nombre     | string   | Sí        | Nombre de usuario                                      | Entre 3 y 50 caracteres, único  |
| email      | string   | Sí        | Correo electrónico                                     | Email válido, único             |
| password   | string   | Sí        | Contraseña                                             | Entre 6 y 30 caracteres         |
| roles      | string[] | No        | Roles asignados (ADMIN, SUPERVISOR, OPERARIO, CLIENTE) | Valores válidos                 |
| empleadoId | number   | No        | ID del empleado vinculado                              | ID válido en la tabla empleados |

#### Respuesta Exitosa (201 Created)

```json
{
  "id": 5,
  "nombre": "nuevo_usuario",
  "email": "usuario@mva.com",
  "estado": "ACTIVO",
  "roles": ["SUPERVISOR"],
  "empleadoId": 5
}
```

### Obtener Usuarios

**Endpoint: GET /api/users**
**Roles permitidos: ADMIN, SUPERVISOR**
**Descripción: Recupera los usuarios registrados en el sistema. Se permite realizar búsquedas por nombre, email o estado, y paginar los resultados.**

**Parámetros de Query Opcionales:**
| Parámetro | Tipo | Descripción |
|-----------|--------|-----------------------------------------------------------------------------|
| search | string | Búsqueda parcial por nombre, correo electrónico o estado del usuario |
| page | number | Número de página a recuperar (por defecto: 1) |
| limit | number | Cantidad de resultados por página (por defecto: 10) |

El parámetro search no distingue entre mayúsculas y minúsculas y aplica búsqueda parcial sobre nombre, email y estado.

**Ejemplos:**
GET /api/users
GET /api/users?search=admin
GET /api/users?search=inactivo&page=2&limit=5

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Juan Admin",
      "email": "juan.admin@example.com",
      "estado": "ACTIVO",
      "rol": "ADMIN",
      "fecha_creacion": "2025-01-10T12:00:00.000Z"
    },
    {
      "id": 2,
      "nombre": "Lucía Operadora",
      "email": "lucia@example.com",
      "estado": "INACTIVO",
      "rol": "OPERADOR",
      "fecha_creacion": "2025-02-20T15:30:00.000Z"
    }
    // Más usuarios...
  ],
  "totalItems": 8,
  "currentPage": 1,
  "totalPages": 1
}
```

### Actualización de Usuario

**Endpoint:** `PATCH /api/users/:id`  
**Roles permitidos:** Cualquier usuario autenticado

```http
PATCH /api/users/5
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "nuevo_email@mva.com",
  "roles": ["SUPERVISOR", "OPERARIO"]
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

#### Respuesta Exitosa (200 OK)

```json
{
  "id": 5,
  "nombre": "nuevo_usuario",
  "email": "nuevo_email@mva.com",
  "estado": "ACTIVO",
  "roles": ["SUPERVISOR", "OPERARIO"],
  "empleadoId": 5
}
```

### Cambiar Contraseña

**Endpoint:** `PATCH /api/users/{id}/password`  
**Roles permitidos:** ADMIN, Usuario propio

```http
PATCH /api/users/5/password
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "currentPassword": "contraseña123",
  "newPassword": "nueva_contraseña123"
}
```

| Campo           | Tipo   | Requerido | Descripción       | Validación              |
| --------------- | ------ | --------- | ----------------- | ----------------------- |
| currentPassword | string | Sí        | Contraseña actual | Debe coincidir          |
| newPassword     | string | Sí        | Nueva contraseña  | Entre 6 y 30 caracteres |

#### Respuesta Exitosa (200 OK)

```json
{
  "message": "Contraseña actualizada correctamente"
}
```

### Cambiar Estado

**Endpoint:** `PATCH /api/users/:id/status`  
**Roles permitidos:** ADMIN, SUPERVISOR

```http
PATCH /api/users/5/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "INACTIVO"
}
```

| Campo  | Tipo   | Requerido | Descripción              | Validación                |
| ------ | ------ | --------- | ------------------------ | ------------------------- |
| estado | string | Sí        | Nuevo estado del usuario | Valores: ACTIVO, INACTIVO |

#### Respuesta Exitosa (200 OK)

```json
{
  "id": 5,
  "nombre": "nuevo_usuario",
  "email": "nuevo_email@mva.com",
  "estado": "INACTIVO",
  "roles": ["SUPERVISOR", "OPERARIO"],
  "empleadoId": 5
}
```

### Eliminar Usuario

**Endpoint:** `DELETE /api/users/:id`  
**Roles permitidos:** ADMIN

```http
DELETE /api/users/5
Authorization: Bearer {{token}}
```

#### Respuesta Exitosa (200 OK)

```json
{
  "message": "Usuario eliminado correctamente"
}
```

## 6. Usuario Administrador Inicial

Para inicializar el sistema, se debe crear un usuario administrador mediante el script de inicialización:

### Requisitos previos

1. Base de datos PostgreSQL configurada y en ejecución
2. Variables de entorno configuradas en un archivo .env en la raíz del proyecto

### Pasos para crear el usuario administrador

Desde la raíz del proyecto, ejecuta el siguiente comando:

```bash
npx ts-node -r tsconfig-paths/register src/scripts/create-admin-standalone.ts
```

Deberías ver una salida similar a esta:

```
Iniciando proceso de creación de usuario administrador...
Conexión a la base de datos establecida correctamente
¡Usuario administrador creado exitosamente!
-------------------------------------
Username: admin
Password: admin123
Email: admin@mva.com
Roles: ADMIN
ID: 1
-------------------------------------
¡IMPORTANTE! Recuerda cambiar esta contraseña después del primer inicio de sesión.
Conexión a la base de datos cerrada
Script finalizado correctamente
```

### Credenciales del usuario administrador inicial

| Campo    | Valor         |
| -------- | ------------- |
| Username | admin         |
| Password | admin123      |
| Email    | admin@mva.com |
| Rol      | ADMIN         |

> **Importante**: Por motivos de seguridad, cambia la contraseña del usuario administrador después del primer inicio de sesión.

## 7. Flujos de Autenticación Completos

### 1. Inicio de sesión y acceso a recurso protegido

1. **Iniciar sesión**

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

2. **Guardar el token recibido**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "admin",
    "email": "admin@mva.com",
    "roles": ["ADMIN"]
  }
}
```

3. **Acceder a un recurso protegido usando el token**

```http
GET /api/clients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Crear un nuevo usuario y asignar roles

1. **Iniciar sesión como administrador**

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

2. **Crear un nuevo usuario**

```http
POST /api/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "supervisor1",
  "email": "supervisor@mva.com",
  "password": "supervisor123",
  "roles": ["SUPERVISOR"],
  "empleadoId": 2
}
```

3. **Iniciar sesión con el nuevo usuario**

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "supervisor1",
  "password": "supervisor123"
}
```

## 8. Integración con Postman

Para facilitar el desarrollo y pruebas, puedes configurar Postman para manejar la autenticación automáticamente:

### Crear Variables de Entorno

1. Crea una variable `baseUrl` con el valor del servidor (por ejemplo, `http://localhost:3000/api`)
2. Crea una variable `token` que se actualizará automáticamente

### Configurar una Solicitud de Login que Guarde el Token

1. Crea una solicitud POST a `{{baseUrl}}/auth/login` con las credenciales
2. En la pestaña "Tests", añade este código:

```javascript
if (pm.response.code === 200) {
  var jsonData = pm.response.json();
  pm.environment.set('token', jsonData.access_token);
  console.log('Token guardado con éxito');
}
```

3. Ahora cada vez que ejecutes esta solicitud, la variable `token` se actualizará automáticamente

### Configurar Autorización Automática

Para las solicitudes que requieren autenticación:

1. Ve a la pestaña "Authorization"
2. Selecciona el tipo "Bearer Token"
3. En el campo "Token", ingresa `{{token}}`

## 9. Solución de Problemas

### Error: "Token inválido" o "No autorizado"

- Verifica que el token no ha expirado
- Asegúrate de usar el formato correcto: `Bearer [token]`
- Verifica que el usuario no ha sido desactivado

### Error: "No tiene permisos para realizar esta acción"

- El usuario no tiene los roles necesarios para acceder al recurso solicitado
- Verifica los roles del usuario en la respuesta del login
- Solo un administrador puede modificar roles

### Error: "El nombre de usuario ya está en uso"

- Cada nombre de usuario debe ser único
- Elige un nombre de usuario diferente

### Error: "El correo electrónico ya está en uso"

- Cada dirección de correo electrónico debe ser única
- Utiliza otra dirección de correo electrónico

## 10. Mejores Prácticas

1. **Cambios de contraseña**:

   - Exige cambios de contraseña periódicos
   - Implementa políticas de complejidad de contraseñas

2. **Gestión de sesiones**:

   - Cierra sesión cuando detectes actividad sospechosa
   - Configura tiempos de expiración de token adecuados

3. **Asignación de roles**:

   - Asigna los mínimos privilegios necesarios
   - Revisa periódicamente los roles asignados a los usuarios

4. **Seguridad**:

   - Nunca expongas información sensible en los logs
   - Implementa bloqueo de cuenta después de múltiples intentos fallidos de inicio de sesión
   - Utiliza HTTPS para todas las comunicaciones

5. **Auditoría**:
   - Registra todas las acciones administrativas
   - Implementa un sistema de alertas para actividades sospechosas

---

Este documento proporciona una guía completa sobre el sistema de autenticación y gestión de usuarios en MVA Backend. Para preguntas o problemas específicos, contacta al equipo de desarrollo.
