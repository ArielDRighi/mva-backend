# Documentación de API de Empleados

Esta documentación describe los endpoints disponibles para la gestión de empleados en el sistema MVA.

## Base URL

Todos los endpoints comienzan con `/api/employees`

## Autenticación

Todos los endpoints requieren autenticación mediante token JWT en el encabezado:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Crear un Empleado

**Endpoint:** `POST /`  
**Permisos requeridos:** `ADMIN`, `SUPERVISOR`  
**Descripción:** Crea un nuevo empleado en el sistema.

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
  "estado": "ACTIVO" // Opcional, por defecto es "ACTIVO"
}
```

**Respuesta exitosa (200):**

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
  "estado": "ACTIVO"
}
```

**Posibles errores:**

- 400 Bad Request: Datos inválidos o faltantes
- 409 Conflict: Ya existe un empleado con el mismo documento o email

### 2. Obtener todos los Empleados

**Endpoint:** `GET /`  
**Permisos requeridos:** Cualquier usuario autenticado  
**Descripción:** Recupera la lista de todos los empleados.

**Parámetros opcionales:**

- cargo: Filtra empleados por cargo (ejemplo: `/employees?cargo=Conductor`)

**Respuesta exitosa (200):**

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
        "estado": "ACTIVO"
    },
    {
        "id": 2,
        ...
    }
]
```

### 3. Obtener un Empleado por ID

**Endpoint:** `GET /:id`  
**Permisos requeridos:** Cualquier usuario autenticado  
**Descripción:** Recupera la información de un empleado específico por su ID.

**Parámetros de ruta:**

- id: ID del empleado

**Respuesta exitosa (200):**

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
  "estado": "ACTIVO"
}
```

**Posibles errores:**

- 404 Not Found: Empleado no encontrado

### 4. Obtener un Empleado por documento

**Endpoint:** `GET /documento/:documento`  
**Permisos requeridos:** Cualquier usuario autenticado  
**Descripción:** Recupera la información de un empleado por su número de documento.

**Parámetros de ruta:**

- documento: Número de documento del empleado

**Respuesta exitosa (200):**

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
  "estado": "ACTIVO"
}
```

**Posibles errores:**

- 404 Not Found: Empleado no encontrado

### 5. Actualizar un Empleado

**Endpoint:** `PUT /:id`  
**Permisos requeridos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza la información de un empleado existente.

**Parámetros de ruta:**

- id: ID del empleado

**Request Body (campos opcionales):**

```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez Rodríguez",
  "documento": "12345678",
  "telefono": "987654321",
  "email": "juancarlos.perez@example.com",
  "direccion": "Nueva Dirección 456",
  "fecha_nacimiento": "1990-01-01T00:00:00.000Z",
  "fecha_contratacion": "2023-01-01T00:00:00.000Z",
  "cargo": "Supervisor",
  "estado": "INACTIVO"
}
```

**Respuesta exitosa (200):**

```json
{
  "id": 1,
  "nombre": "Juan Carlos",
  "apellido": "Pérez Rodríguez",
  "documento": "12345678",
  "telefono": "987654321",
  "email": "juancarlos.perez@example.com",
  "direccion": "Nueva Dirección 456",
  "fecha_nacimiento": "1990-01-01",
  "fecha_contratacion": "2023-01-01",
  "cargo": "Supervisor",
  "estado": "INACTIVO"
}
```

**Posibles errores:**

- 400 Bad Request: Datos inválidos
- 404 Not Found: Empleado no encontrado
- 409 Conflict: Ya existe otro empleado con el mismo documento o email

### 6. Eliminar un Empleado

**Endpoint:** `DELETE /:id`  
**Permisos requeridos:** ADMIN  
**Descripción:** Elimina un empleado del sistema.

**Parámetros de ruta:**

- id: ID del empleado

**Respuesta exitosa (200):**

```json
{
  "message": "Empleado Juan Pérez eliminado correctamente"
}
```

**Posibles errores:**

- 404 Not Found: Empleado no encontrado

### 7. Cambiar Estado de un Empleado

**Endpoint:** `PATCH /:id/estado`  
**Permisos requeridos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza solo el estado de un empleado.

**Parámetros de ruta:**

- id: ID del empleado

**Request Body:**

```json
{
  "estado": "INACTIVO" // Posibles valores: "ACTIVO", "INACTIVO", "SUSPENDIDO", etc.
}
```

**Respuesta exitosa (200):**

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
  "estado": "INACTIVO"
}
```

**Posibles errores:**

- 404 Not Found: Empleado no encontrado

## Estructura de la Entidad Empleado

```typescript
export class Empleado {
  id: number; // Identificador único
  nombre: string; // Nombre del empleado
  apellido: string; // Apellido del empleado
  documento: string; // Número de identificación (único)
  telefono: string; // Número telefónico
  email: string; // Correo electrónico (único)
  direccion: string; // Dirección (opcional)
  fecha_nacimiento: Date; // Fecha de nacimiento (opcional)
  fecha_contratacion: Date; // Fecha de contratación
  cargo: string; // Cargo/puesto del empleado
  estado: string; // Estado (ACTIVO, INACTIVO, etc.)
}
```

## Notas Importantes

- Todas las fechas deben enviarse en formato ISO 8601 (YYYY-MM-DDThh:mm:ss.sssZ)
- Los campos únicos (documento, email) no pueden repetirse en otros empleados
- El campo estado por defecto es "ACTIVO" si no se especifica

Esta documentación proporciona una guía completa de los endpoints de empleados, incluyendo ejemplos, formato de peticiones y respuestas, y posibles errores. Es útil tanto para desarrolladores frontend que consumen la API como para cualquier equipo que necesite integrar con este sistema.
