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
   - 8. Gestión de Licencias de Conducir
   - 9. Gestión de Contactos de Emergencia
   - 10. Gestión de Exámenes Preocupacionales
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
  "estado": "DISPONIBLE",
  "diasVacacionesDisponibles": 15,
  "diasVacacionesRestantes": 15,
  "diasVacacionesTotales": 15
}
```

| Campo                     | Tipo               | Requerido | Descripción                                | Validación                     |
| ------------------------- | ------------------ | --------- | ------------------------------------------ | ------------------------------ |
| nombre                    | string             | Sí        | Nombre del empleado                        | Entre 2 y 100 caracteres       |
| apellido                  | string             | Sí        | Apellido del empleado                      | Entre 2 y 100 caracteres       |
| documento                 | string             | Sí        | Número de identificación                   | Entre 5 y 20 caracteres, único |
| telefono                  | string             | Sí        | Número telefónico                          |                                |
| email                     | string             | Sí        | Correo electrónico                         | Email válido, único            |
| direccion                 | string             | No        | Dirección física                           |                                |
| fecha_nacimiento          | string (fecha ISO) | No        | Fecha de nacimiento                        |                                |
| fecha_contratacion        | string (fecha ISO) | Sí        | Fecha de contratación                      |                                |
| cargo                     | string             | Sí        | Puesto de trabajo                          |                                |
| estado                    | string             | No        | Estado inicial (default: "DISPONIBLE")     |                                |
| diasVacacionesDisponibles | number             | No        | Cantidad de días de vacaciones disponibles | Valor por defecto: 15          |
| diasVacacionesRestantes   | number             | No        | Días de vacaciones restantes               | Se actualiza automáticamente   |
| diasVacacionesTotales     | number             | No        | Días totales acumulados de vacaciones      | Se actualiza anualmente        |

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
  "estado": "DISPONIBLE",
  "diasVacacionesDisponibles": 15,
  "diasVacacionesRestantes": 15,
  "diasVacacionesTotales": 15
}
```

**Validaciones:**

- Verifica que no exista otro empleado con el mismo documento
- Verifica que no exista otro empleado con el mismo email

### 2. Obtener Todos los Empleados

**Endpoint:** `GET /api/employees`  
**Roles permitidos:** ADMIN, SUPERVISOR
**Descripción:** Recupera la lista de empleados registrados en el sistema, con soporte para búsqueda y resultados paginados.

**Parámetros de consulta opcionales:**
| Parámetro | Tipo | Descripción |
|-----------|--------|-----------------------------------------------------------------------------|
| search | string | Búsqueda por nombre, apellido, documento, cargo o estado (no sensible a mayúsculas/minúsculas). Acepta múltiples palabras separadas por espacios para refinar la búsqueda. |
| page | number | Número de página a recuperar (por defecto: 1) |
| limit | number | Cantidad de resultados por página (por defecto: 10) |

**Ejemplos:**

```
GET /api/employees
GET /api/employees?search=Conductor
GET /api/employees?search=gomez
GET /api/employees?search=Juan Perez
GET /api/employees?search=DISPONIBLE&page=2&limit=5
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
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
      "estado": "DISPONIBLE",
      "diasVacacionesDisponibles": 15,
      "diasVacacionesRestantes": 10,
      "diasVacacionesTotales": 15
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
      "estado": "ASIGNADO",
      "diasVacacionesDisponibles": 15,
      "diasVacacionesRestantes": 15,
      "diasVacacionesTotales": 15
    }
    // Más empleados...
  ],
  "totalItems": 25,
  "currentPage": 1,
  "totalPages": 3
}
```

### 3. Obtener un Empleado Específico

**Endpoint:** `GET /api/employees/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

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
  "estado": "DISPONIBLE",
  "diasVacacionesDisponibles": 15,
  "diasVacacionesRestantes": 10,
  "diasVacacionesTotales": 15,
  "licencia": {
    "licencia_id": 1,
    "categoria": "B",
    "fecha_expedicion": "2022-01-15",
    "fecha_vencimiento": "2027-01-15"
  },
  "emergencyContacts": [
    {
      "id": 1,
      "nombre": "María",
      "apellido": "Gómez",
      "parentesco": "Esposa",
      "telefono": "123456789"
    }
  ],
  "examenesPreocupacionales": [
    {
      "examen_preocupacional_id": 1,
      "fecha_examen": "2023-01-10",
      "resultado": "APTO",
      "observaciones": "Excelente condición física",
      "realizado_por": "Dr. Martínez - Centro Médico San Juan"
    }
  ],
  "talleRopa": {
    "id": 1,
    "camisa": "M",
    "pantalon": "40",
    "calzado": "42"
  }
}
```

### 4. Buscar Empleado por Documento

**Endpoint:** `GET /api/employees/documento/{documento}`  
**Roles permitidos:** ADMIN, SUPERVISOR

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
  "estado": "DISPONIBLE",
  "diasVacacionesDisponibles": 15,
  "diasVacacionesRestantes": 10,
  "diasVacacionesTotales": 15
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
  "cargo": "Supervisor",
  "diasVacacionesDisponibles": 20
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

**Validaciones:**

- Si se actualiza el documento, verifica que no exista otro empleado con el mismo documento
- Si se actualiza el email, verifica que no exista otro empleado con el mismo email

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
  "estado": "DISPONIBLE",
  "diasVacacionesDisponibles": 20,
  "diasVacacionesRestantes": 20,
  "diasVacacionesTotales": 20
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

**Validaciones:**

- Verifica que el empleado no esté asignado a ningún servicio activo antes de eliminarlo

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Empleado Juan Carlos Pérez López eliminado correctamente"
}
```

### 8. Gestión de Licencias de Conducir

#### 8.1 Crear Licencia de Conducir

**Endpoint:** `POST /api/employees/licencia/{empleadoId}`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO

**Request Body:**

```json
{
  "categoria": "B",
  "fecha_expedicion": "2022-01-15T00:00:00.000Z",
  "fecha_vencimiento": "2027-01-15T00:00:00.000Z"
}
```

| Campo             | Tipo               | Requerido | Descripción                         | Validación                   |
| ----------------- | ------------------ | --------- | ----------------------------------- | ---------------------------- |
| categoria         | string             | Sí        | Categoría de la licencia            |                              |
| fecha_expedicion  | string (fecha ISO) | Sí        | Fecha de emisión de la licencia     | Formato válido de fecha      |
| fecha_vencimiento | string (fecha ISO) | Sí        | Fecha de vencimiento de la licencia | Posterior a fecha_expedicion |

**Validaciones:**

- Verifica que el empleado exista
- Verifica que el empleado no tenga ya una licencia asociada

**Respuesta Exitosa (201 Created):**

```json
{
  "licencia_id": 1,
  "categoria": "B",
  "fecha_expedicion": "2022-01-15",
  "fecha_vencimiento": "2027-01-15",
  "empleado": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "12345678"
  }
}
```

#### 8.2 Obtener Licencia de un Empleado

**Endpoint:** `GET /api/employees/licencia/{empleadoId}`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO

**Ejemplo:**

```
GET /api/employees/licencia/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "12345678",
  "licencia": {
    "licencia_id": 1,
    "categoria": "B",
    "fecha_expedicion": "2022-01-15",
    "fecha_vencimiento": "2027-01-15"
  }
}
```

#### 8.3 Actualizar Licencia de Conducir

**Endpoint:** `PUT /api/employees/licencia/update/{empleadoId}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "categoria": "C",
  "fecha_expedicion": "2023-05-10T00:00:00.000Z",
  "fecha_vencimiento": "2028-05-10T00:00:00.000Z"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "licencia_id": 1,
  "categoria": "C",
  "fecha_expedicion": "2023-05-10",
  "fecha_vencimiento": "2028-05-10"
}
```

#### 8.4 Eliminar Licencia de Conducir

**Endpoint:** `DELETE /api/employees/licencia/delete/{licenciaId}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
DELETE /api/employees/licencia/delete/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Licencia eliminada correctamente"
}
```

#### 8.5 Obtener Licencias por Vencer

**Endpoint:** `GET /api/employees/licences/to/expire`  
**Roles permitidos:** ADMIN

**Descripción:** Recupera las licencias que vencerán en los próximos 30 días.

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "licencia_id": 1,
    "categoria": "B",
    "fecha_expedicion": "2022-01-15",
    "fecha_vencimiento": "2023-06-01",
    "empleado": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "documento": "12345678"
    }
  },
  {
    "licencia_id": 3,
    "categoria": "A",
    "fecha_expedicion": "2020-10-25",
    "fecha_vencimiento": "2023-06-05",
    "empleado": {
      "id": 5,
      "nombre": "Carlos",
      "apellido": "López",
      "documento": "45678912"
    }
  }
]
```

#### 8.6 Obtener Todas las Licencias

**Endpoint:** `GET /api/employees/licencias`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "licencia_id": 1,
    "categoria": "B",
    "fecha_expedicion": "2022-01-15",
    "fecha_vencimiento": "2027-01-15",
    "empleado": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  },
  {
    "licencia_id": 2,
    "categoria": "C",
    "fecha_expedicion": "2021-05-20",
    "fecha_vencimiento": "2026-05-20",
    "empleado": {
      "id": 2,
      "nombre": "María",
      "apellido": "Gómez"
    }
  }
]
```

### 9. Gestión de Contactos de Emergencia

#### 9.1 Crear Contacto de Emergencia

**Endpoint:** `POST /api/employees/emergency/{empleadoId}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "nombre": "María",
  "apellido": "Gómez",
  "parentesco": "Esposa",
  "telefono": "123456789"
}
```

| Campo      | Tipo   | Requerido | Descripción                         |
| ---------- | ------ | --------- | ----------------------------------- |
| nombre     | string | Sí        | Nombre del contacto de emergencia   |
| apellido   | string | Sí        | Apellido del contacto de emergencia |
| parentesco | string | Sí        | Relación con el empleado            |
| telefono   | string | Sí        | Teléfono de contacto                |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 1,
  "nombre": "María",
  "apellido": "Gómez",
  "parentesco": "Esposa",
  "telefono": "123456789",
  "empleado": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez"
  }
}
```

#### 9.2 Obtener Contactos de Emergencia de un Empleado

**Endpoint:** `GET /api/employees/emergency/{empleadoId}`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO

**Ejemplo:**

```
GET /api/employees/emergency/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  "documento": "12345678",
  "emergencyContacts": [
    {
      "id": 1,
      "nombre": "María",
      "apellido": "Gómez",
      "parentesco": "Esposa",
      "telefono": "123456789"
    },
    {
      "id": 2,
      "nombre": "Pedro",
      "apellido": "Pérez",
      "parentesco": "Padre",
      "telefono": "987654321"
    }
  ]
}
```

#### 9.3 Actualizar Contacto de Emergencia

**Endpoint:** `PUT /api/employees/emergency/{contactoId}`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO

**Request Body:**

```json
{
  "nombre": "María",
  "apellido": "Rodríguez",
  "parentesco": "Esposa",
  "telefono": "555123456"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "nombre": "María",
  "apellido": "Rodríguez",
  "parentesco": "Esposa",
  "telefono": "555123456"
}
```

#### 9.4 Eliminar Contacto de Emergencia

**Endpoint:** `DELETE /api/employees/emergency/delete/{contactoId}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
DELETE /api/employees/emergency/delete/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Contacto de emergencia eliminado correctamente"
}
```

### 10. Gestión de Exámenes Preocupacionales

#### 10.1 Crear Examen Preocupacional

**Endpoint:** `POST /api/employees/examen/create`  
**Roles permitidos:** ADMIN

**Request Body:**

```json
{
  "empleado_id": 1,
  "fecha_examen": "2023-01-10T00:00:00.000Z",
  "resultado": "APTO",
  "observaciones": "Excelente condición física",
  "realizado_por": "Dr. Martínez - Centro Médico San Juan"
}
```

| Campo         | Tipo               | Requerido | Descripción                          |
| ------------- | ------------------ | --------- | ------------------------------------ |
| empleado_id   | number             | Sí        | ID del empleado                      |
| fecha_examen  | string (fecha ISO) | Sí        | Fecha en que se realizó el examen    |
| resultado     | string             | Sí        | Resultado del examen (APTO/NO APTO)  |
| observaciones | string             | No        | Observaciones adicionales del médico |
| realizado_por | string             | Sí        | Médico o institución que lo realizó  |

**Validaciones:**

- Verifica que el empleado exista

**Respuesta Exitosa (201 Created):**

```json
{
  "examen_preocupacional_id": 1,
  "fecha_examen": "2023-01-10",
  "resultado": "APTO",
  "observaciones": "Excelente condición física",
  "realizado_por": "Dr. Martínez - Centro Médico San Juan",
  "empleado": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez"
  }
}
```

#### 10.2 Obtener Exámenes Preocupacionales de un Empleado

**Endpoint:** `GET /api/employees/examen/{empleadoId}`  
**Roles permitidos:** ADMIN

**Ejemplo:**

```
GET /api/employees/examen/1
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "examen_preocupacional_id": 1,
    "fecha_examen": "2023-01-10",
    "resultado": "APTO",
    "observaciones": "Excelente condición física",
    "realizado_por": "Dr. Martínez - Centro Médico San Juan"
  },
  {
    "examen_preocupacional_id": 2,
    "fecha_examen": "2024-01-15",
    "resultado": "APTO",
    "observaciones": "Control anual",
    "realizado_por": "Dra. García - Centro Médico Laboral"
  }
]
```

#### 10.3 Actualizar Examen Preocupacional

**Endpoint:** `PUT /api/employees/examen/modify/{examenId}`  
**Roles permitidos:** ADMIN

**Request Body:**

```json
{
  "fecha_examen": "2023-01-15T00:00:00.000Z",
  "resultado": "APTO CON OBSERVACIONES",
  "observaciones": "Apto para el trabajo, pero requiere control de presión arterial",
  "realizado_por": "Dr. Martínez - Centro Médico San Juan"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "examen_preocupacional_id": 1,
  "fecha_examen": "2023-01-15",
  "resultado": "APTO CON OBSERVACIONES",
  "observaciones": "Apto para el trabajo, pero requiere control de presión arterial",
  "realizado_por": "Dr. Martínez - Centro Médico San Juan"
}
```

#### 10.4 Eliminar Examen Preocupacional

**Endpoint:** `DELETE /api/employees/examen/delete/{examenId}`  
**Roles permitidos:** ADMIN

**Ejemplo:**

```
DELETE /api/employees/examen/delete/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Examen preocupacional eliminado correctamente"
}
```

## Estados de Empleados

Los empleados pueden tener los siguientes estados:

| Estado     | Descripción                                  | Asignable a Servicios |
| ---------- | -------------------------------------------- | --------------------- |
| DISPONIBLE | Empleado listo para ser asignado a servicios | Sí                    |
| ASIGNADO   | Empleado actualmente asignado a un servicio  | Sí\*                  |
| VACACIONES | Empleado de vacaciones                       | No                    |
| LICENCIA   | Empleado con licencia (médica u otra)        | No                    |
| INACTIVO   | Empleado temporalmente inactivo              | No                    |
| BAJA       | Empleado que ya no trabaja en la empresa     | No                    |

\*Los empleados en estado ASIGNADO pueden ser asignados a servicios adicionales para la misma fecha o fechas futuras, siempre que no haya conflicto de horarios con sus servicios ya asignados.

## Cargos Comunes

Algunos de los cargos comunes utilizados en el sistema:

- Conductor
- Técnico
- Supervisor
- Administrativo
- Gerente

No hay una lista predefinida de cargos. Puedes usar cualquier valor de texto para representar el cargo.

## Manejo de Errores

### Respuesta de Error: Empleado no encontrado (404 Not Found)

```json
{
  "message": "Empleado con id 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Respuesta de Error: Duplicado (409 Conflict)

```json
{
  "message": "Ya existe un empleado con el documento 12345678",
  "error": "Conflict",
  "statusCode": 409
}
```

```json
{
  "message": "Ya existe un empleado con el email juan.perez@example.com",
  "error": "Conflict",
  "statusCode": 409
}
```

### Respuesta de Error: Empleado con servicios asignados (400 Bad Request)

```json
{
  "message": "El empleado no puede ser eliminado ya que se encuentra asignado a uno o más servicios.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Respuesta de Error: Licencia ya existente (409 Conflict)

```json
{
  "message": "El empleado con id 1 ya tiene una licencia asociada",
  "error": "Conflict",
  "statusCode": 409
}
```

### Respuesta de Error: Licencia no encontrada (404 Not Found)

```json
{
  "message": "Licencia con id 999 no encontrada",
  "error": "Not Found",
  "statusCode": 404
}
```

### Respuesta de Error: Contacto no encontrado (404 Not Found)

```json
{
  "message": "Contacto de emergencia con id 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Respuesta de Error: Examen no encontrado (404 Not Found)

```json
{
  "message": "Examen preocupacional con id 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
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

### 4. Gestión de Vacaciones

1. **Consultar días disponibles de vacaciones**

   ```
   GET /api/employees/1
   ```

   Respuesta:

   ```json
   {
     "id": 1,
     "nombre": "Juan Carlos",
     "apellido": "Pérez López",
     // ...otros campos...
     "diasVacacionesDisponibles": 15,
     "diasVacacionesRestantes": 10,
     "diasVacacionesTotales": 15
   }
   ```

2. **Ajustar días de vacaciones disponibles (solo ADMIN)**

   ```
   PUT /api/employees/1
   {
     "diasVacacionesDisponibles": 20
   }
   ```

3. **Solicitar vacaciones**

   ```
   POST /api/employee-leaves
   {
     "employeeId": 1,
     "fechaInicio": "2025-05-15T00:00:00.000Z",
     "fechaFin": "2025-05-30T00:00:00.000Z",
     "tipoLicencia": "VACACIONES",
     "notas": "Vacaciones anuales programadas"
   }
   ```

   Al aprobar estas vacaciones, el campo `diasVacacionesRestantes` se actualizará automáticamente basado en los días hábiles del período solicitado.

### Recomendaciones Adicionales

- Antes de eliminar un empleado, verifica que no tenga servicios asignados
- Los empleados en estados "VACACIONES", "LICENCIA", "INACTIVO" o "BAJA" no pueden ser asignados a servicios
- Los usuarios ADMIN pueden crear cuentas de usuario asociadas a empleados para darles acceso al sistema
- El documento y email deben ser únicos en todo el sistema para evitar duplicados
- Siempre mantén actualizado el estado de los empleados para una correcta asignación de servicios
- Los empleados con estado "ASIGNADO" pueden ser asignados a servicios adicionales en la misma fecha o fechas futuras, siempre que no haya conflicto de horarios
