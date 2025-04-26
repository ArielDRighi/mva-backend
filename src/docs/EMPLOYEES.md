# Documentación de la API de Empleados (MVA Backend)

## Índice

1. Introducción
2. Autenticación
3. Endpoints de Empleados
   - 1. Crear un Empleado
   - 2. Obtener Todos los Empleados
   - 3. Obtener un Empleado Específico
   - 4. Buscar Empleado por Documento
   - 5. Actualizar un Empleado
   - 6. Cambiar Estado de un Empleado
   - 7. Eliminar un Empleado
4. Estados de Empleados
5. Cargos Comunes
6. Manejo de Errores
7. Ejemplos de Flujos Completos

## Introducción

La API de Empleados permite gestionar el personal de la empresa, incluyendo la creación, actualización, cambios de estado, y asignación a servicios. Esta API es fundamental para la administración del capital humano utilizado en los servicios de instalación y mantenimiento de baños químicos.

## Autenticación

Todas las solicitudes requieren autenticación mediante token JWT. El token debe incluirse en el encabezado `Authorization`:

```
Authorization: Bearer {tu_token_jwt}
```

Para obtener un token:

```
POST /api/auth/login
Content-Type: application/json

{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

## Endpoints de Empleados

### 1. Crear un Empleado

**Endpoint:** `POST /api/employees`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "12345678",
  "telefono": "123456789",
  "email": "juan.perez@example.com",
  "direccion": "Calle Principal 123",
  "fecha_nacimiento": "1990-01-01T00:00:00.000Z",
  "fecha_contratacion": "2023-01-01T00:00:00.000Z",
  "cargo": "Conductor",
  "estado": "DISPONIBLE"
}
```

| Campo              | Tipo               | Requerido | Descripción                            | Validación                     |
| ------------------ | ------------------ | --------- | -------------------------------------- | ------------------------------ |
| nombre             | string             | Sí        | Nombre del empleado                    | Entre 2 y 100 caracteres       |
| apellido           | string             | Sí        | Apellido del empleado                  | Entre 2 y 100 caracteres       |
| documento          | string             | Sí        | Número de identificación               | Entre 5 y 20 caracteres, único |
| telefono           | string             | Sí        | Número telefónico                      |                                |
| email              | string             | Sí        | Correo electrónico                     | Email válido, único            |
| direccion          | string             | No        | Dirección física                       |                                |
| fecha_nacimiento   | string (fecha ISO) | No        | Fecha de nacimiento                    |                                |
| fecha_contratacion | string (fecha ISO) | Sí        | Fecha de contratación                  |                                |
| cargo              | string             | Sí        | Puesto de trabajo                      |                                |
| estado             | string             | No        | Estado inicial (default: "DISPONIBLE") |                                |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "12345678",
  "telefono": "123456789",
  "email": "juan.perez@example.com",
  "direccion": "Calle Principal 123",
  "fecha_nacimiento": "1990-01-01",
  "fecha_contratacion": "2023-01-01",
  "cargo": "Conductor",
  "estado": "DISPONIBLE"
}
```

### 2. Obtener Todos los Empleados

**Endpoint:** `GET /api/employees`  
**Roles permitidos:** Todos los usuarios autenticados

**Parámetros de consulta opcionales:**

| Parámetro | Tipo   | Descripción                                               |
| --------- | ------ | --------------------------------------------------------- |
| cargo     | string | Filtrar por cargo (ejemplo: "/employees?cargo=Conductor") |

**Ejemplos:**

```
GET /api/employees
GET /api/employees?cargo=Conductor
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "12345678",
    "telefono": "123456789",
    "email": "juan.perez@example.com",
    "direccion": "Calle Principal 123",
    "fecha_nacimiento": "1990-01-01",
    "fecha_contratacion": "2023-01-01",
    "cargo": "Conductor",
    "estado": "DISPONIBLE"
  },
  {
    "id": 2,
    "nombre": "María",
    "apellido": "Gómez",
    "documento": "87654321",
    "telefono": "987654321",
    "email": "maria.gomez@example.com",
    "direccion": "Avenida Segunda 456",
    "fecha_nacimiento": "1992-05-15",
    "fecha_contratacion": "2023-02-15",
    "cargo": "Técnico",
    "estado": "ASIGNADO"
  }
]
```

### 3. Obtener un Empleado Específico

**Endpoint:** `GET /api/employees/{id}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/employees/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "12345678",
  "telefono": "123456789",
  "email": "juan.perez@example.com",
  "direccion": "Calle Principal 123",
  "fecha_nacimiento": "1990-01-01",
  "fecha_contratacion": "2023-01-01",
  "cargo": "Conductor",
  "estado": "DISPONIBLE"
}
```

### 4. Buscar Empleado por Documento

**Endpoint:** `GET /api/employees/documento/{documento}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/employees/documento/12345678
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "12345678",
  "telefono": "123456789",
  "email": "juan.perez@example.com",
  "direccion": "Calle Principal 123",
  "fecha_nacimiento": "1990-01-01",
  "fecha_contratacion": "2023-01-01",
  "cargo": "Conductor",
  "estado": "DISPONIBLE"
}
```

### 5. Actualizar un Empleado

**Endpoint:** `PUT /api/employees/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez López",
  "telefono": "123456789",
  "email": "juancarlos.perez@example.com",
  "direccion": "Nueva Dirección 789",
  "cargo": "Supervisor"
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "nombre": "Juan Carlos",
  "apellido": "Pérez López",
  "documento": "12345678",
  "telefono": "123456789",
  "email": "juancarlos.perez@example.com",
  "direccion": "Nueva Dirección 789",
  "fecha_nacimiento": "1990-01-01",
  "fecha_contratacion": "2023-01-01",
  "cargo": "Supervisor",
  "estado": "DISPONIBLE"
}
```

### 6. Cambiar Estado de un Empleado

**Endpoint:** `PATCH /api/employees/{id}/estado`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "estado": "LICENCIA"
}
```

**Estados válidos:**

- DISPONIBLE
- ASIGNADO (normalmente asignado automáticamente por el sistema)
- VACACIONES
- LICENCIA
- INACTIVO
- BAJA

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "nombre": "Juan Carlos",
  "apellido": "Pérez López",
  "documento": "12345678",
  "telefono": "123456789",
  "email": "juancarlos.perez@example.com",
  "direccion": "Nueva Dirección 789",
  "fecha_nacimiento": "1990-01-01",
  "fecha_contratacion": "2023-01-01",
  "cargo": "Supervisor",
  "estado": "LICENCIA"
}
```

### 7. Eliminar un Empleado

**Endpoint:** `DELETE /api/employees/{id}`  
**Roles permitidos:** ADMIN

**Ejemplo:**

```
DELETE /api/employees/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Empleado Juan Carlos Pérez López eliminado correctamente"
}
```

## Estados de Empleados

Los empleados pueden tener los siguientes estados:

| Estado     | Descripción                                  | Asignable a Servicios |
| ---------- | -------------------------------------------- | --------------------- |
| DISPONIBLE | Empleado listo para ser asignado a servicios | Sí                    |
| ASIGNADO   | Empleado actualmente asignado a un servicio  | No                    |
| VACACIONES | Empleado de vacaciones                       | No                    |
| LICENCIA   | Empleado con licencia (médica u otra)        | No                    |
| INACTIVO   | Empleado temporalmente inactivo              | No                    |
| BAJA       | Empleado que ya no trabaja en la empresa     | No                    |

## Cargos Comunes

Algunos de los cargos comunes utilizados en el sistema:

- Conductor
- Técnico
- Supervisor
- Administrativo
- Gerente

No hay una lista predefinida de cargos. Puedes usar cualquier valor de texto para representar el cargo.

## Manejo de Errores

### Respuesta de Error (404 Not Found)

```json
{
  "message": "Empleado con id 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Respuesta de Error (409 Conflict)

```json
{
  "message": "Ya existe un empleado con el documento 12345678",
  "error": "Conflict",
  "statusCode": 409
}
```

### Respuesta de Error (400 Bad Request)

```json
{
  "message": "El nombre debe tener entre 2 y 100 caracteres",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Ejemplos de Flujos Completos

### 1. Ciclo de Vida Básico de un Empleado

1. **Crear un nuevo empleado**

   ```
   POST /api/employees
   {
     "nombre": "Juan",
     "apellido": "Pérez",
     "documento": "12345678",
     "telefono": "123456789",
     "email": "juan.perez@example.com",
     "direccion": "Calle Principal 123",
     "fecha_contratacion": "2023-01-01T00:00:00.000Z",
     "cargo": "Conductor"
   }
   ```

2. **Asignar el empleado a un servicio** (esto ocurre automáticamente a través de la API de Servicios)

3. **Completar el servicio** (el empleado vuelve a estado "DISPONIBLE" automáticamente)

4. **Registrar vacaciones para el empleado**

   ```
   PATCH /api/employees/1/estado
   {
     "estado": "VACACIONES"
   }
   ```

5. **Reincorporar al empleado tras sus vacaciones**

   ```
   PATCH /api/employees/1/estado
   {
     "estado": "DISPONIBLE"
   }
   ```

6. **Dar de baja al empleado cuando ya no trabaja en la empresa**
   ```
   PATCH /api/employees/1/estado
   {
     "estado": "BAJA"
   }
   ```

### 2. Actualización de Información Personal

1. **Actualizar detalles de contacto**

   ```
   PUT /api/employees/2
   {
     "telefono": "555123456",
     "direccion": "Nueva Calle 789, Apt 3B"
   }
   ```

2. **Actualizar cargo tras una promoción**
   ```
   PUT /api/employees/2
   {
     "cargo": "Supervisor"
   }
   ```

### 3. Búsqueda y Filtrado de Empleados

1. **Obtener todos los conductores**

   ```
   GET /api/employees?cargo=Conductor
   ```

2. **Buscar empleado por documento**
   ```
   GET /api/employees/documento/30567891
   ```

### Recomendaciones Adicionales

- Antes de eliminar un empleado, verifica que no tenga servicios asignados
- Los empleados en estados diferentes a "DISPONIBLE" no pueden ser asignados a servicios
- Los usuarios ADMIN pueden crear cuentas de usuario asociadas a empleados para darles acceso al sistema
- El documento y email deben ser únicos en todo el sistema para evitar duplicados
- Siempre mantén actualizado el estado de los empleados para una correcta asignación de servicios
