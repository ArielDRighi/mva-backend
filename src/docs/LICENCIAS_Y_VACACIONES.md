# Documentación de la API de Licencias y Vacaciones (MVA Backend)

## Índice

1. Introducción
2. Endpoints de Licencias y Vacaciones
   - Crear una Licencia/Vacación
   - Obtener Todas las Licencias/Vacaciones
   - Obtener una Licencia/Vacación Específica
   - Obtener Licencias por Empleado
   - Actualizar una Licencia/Vacación
   - Aprobar una Licencia/Vacación
   - Eliminar una Licencia/Vacación
3. Tipos de Licencias
4. Ejemplos de Uso
5. Integración con Servicios

## Introducción

El módulo de Licencias y Vacaciones permite gestionar los períodos de ausencia programada de los empleados. Esto es crucial para la planificación de servicios, ya que permite saber cuándo un empleado no estará disponible para ser asignado a un trabajo.

## Endpoints de Licencias y Vacaciones

### 1. Crear una Licencia/Vacación

**Endpoint:** `POST /api/employee-leaves`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "employeeId": 1,
  "fechaInicio": "2025-05-15T00:00:00.000Z",
  "fechaFin": "2025-05-30T00:00:00.000Z",
  "tipoLicencia": "VACACIONES",
  "notas": "Vacaciones anuales programadas"
}
```

| Campo        | Tipo               | Requerido | Descripción                    | Validación                  |
| ------------ | ------------------ | --------- | ------------------------------ | --------------------------- |
| employeeId   | number             | Sí        | ID del empleado                | Debe existir                |
| fechaInicio  | string (fecha ISO) | Sí        | Fecha de inicio de la licencia | Formato válido de fecha     |
| fechaFin     | string (fecha ISO) | Sí        | Fecha de fin de la licencia    | Posterior a fechaInicio     |
| tipoLicencia | string (enum)      | Sí        | Tipo de licencia               | Uno de los valores del enum |
| notas        | string             | No        | Información adicional          |                             |
| aprobado     | boolean            | No        | Estado de aprobación           | Default: false              |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 1,
  "employeeId": 1,
  "fechaInicio": "2025-05-15",
  "fechaFin": "2025-05-30",
  "tipoLicencia": "VACACIONES",
  "notas": "Vacaciones anuales programadas",
  "aprobado": false
}
```

### 2. Obtener Todas las Licencias/Vacaciones

**Endpoint:** `GET /api/employee-leaves`  
**Roles permitidos:** Todos los autenticados

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 1,
    "employeeId": 1,
    "fechaInicio": "2025-05-15",
    "fechaFin": "2025-05-30",
    "tipoLicencia": "VACACIONES",
    "notas": "Vacaciones anuales programadas",
    "aprobado": true,
    "employee": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "documento": "12345678",
      "cargo": "Conductor"
    }
  },
  {
    "id": 2,
    "employeeId": 2,
    "fechaInicio": "2025-06-10",
    "fechaFin": "2025-06-15",
    "tipoLicencia": "LICENCIA_MEDICA",
    "notas": "Recuperación post operatoria",
    "aprobado": true,
    "employee": {
      "id": 2,
      "nombre": "María",
      "apellido": "Gómez",
      "documento": "87654321",
      "cargo": "Técnico"
    }
  }
]
```

### 3. Obtener una Licencia/Vacación Específica

**Endpoint:** `GET /api/employee-leaves/{id}`  
**Roles permitidos:** Todos los autenticados

**Ejemplo:**

```
GET /api/employee-leaves/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "employeeId": 1,
  "fechaInicio": "2025-05-15",
  "fechaFin": "2025-05-30",
  "tipoLicencia": "VACACIONES",
  "notas": "Vacaciones anuales programadas",
  "aprobado": true,
  "employee": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "12345678",
    "cargo": "Conductor"
  }
}
```

### 4. Obtener Licencias por Empleado

**Endpoint:** `GET /api/employee-leaves/employee/{id}`  
**Roles permitidos:** Todos los autenticados

**Ejemplo:**

```
GET /api/employee-leaves/employee/1
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 1,
    "employeeId": 1,
    "fechaInicio": "2025-05-15",
    "fechaFin": "2025-05-30",
    "tipoLicencia": "VACACIONES",
    "notas": "Vacaciones anuales programadas",
    "aprobado": true
  },
  {
    "id": 3,
    "employeeId": 1,
    "fechaInicio": "2025-08-10",
    "fechaFin": "2025-08-15",
    "tipoLicencia": "CAPACITACION",
    "notas": "Curso de manejo defensivo",
    "aprobado": false
  }
]
```

### 5. Actualizar una Licencia/Vacación

**Endpoint:** `PATCH /api/employee-leaves/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
PATCH /api/employee-leaves/1
Content-Type: application/json

{
  "fechaFin": "2025-06-05T00:00:00.000Z",
  "notas": "Vacaciones extendidas por 5 días más"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "employeeId": 1,
  "fechaInicio": "2025-05-15",
  "fechaFin": "2025-06-05",
  "tipoLicencia": "VACACIONES",
  "notas": "Vacaciones extendidas por 5 días más",
  "aprobado": false
}
```

### 6. Aprobar una Licencia/Vacación

**Endpoint:** `PATCH /api/employee-leaves/{id}/approve`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
PATCH /api/employee-leaves/1/approve
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "employeeId": 1,
  "fechaInicio": "2025-05-15",
  "fechaFin": "2025-06-05",
  "tipoLicencia": "VACACIONES",
  "notas": "Vacaciones extendidas por 5 días más",
  "aprobado": true
}
```

### 7. Eliminar una Licencia/Vacación

**Endpoint:** `DELETE /api/employee-leaves/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
DELETE /api/employee-leaves/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Licencia #1 eliminada correctamente"
}
```

## Tipos de Licencias

El sistema maneja los siguientes tipos de licencias:

- `VACACIONES`: Período de descanso anual programado.
- `LICENCIA_MEDICA`: Ausencia por razones de salud.
- `LICENCIA_PERSONAL`: Ausencia por asuntos personales.
- `CAPACITACION`: Ausencia por asistencia a cursos, conferencias o capacitaciones.
- `OTRO`: Otros tipos de ausencia no contemplados en las categorías anteriores.

## Ejemplos de Uso

### Programar vacaciones para un empleado

```
POST /api/employee-leaves
Content-Type: application/json
Authorization: Bearer {token}

{
  "employeeId": 1,
  "fechaInicio": "2025-05-15T00:00:00.000Z",
  "fechaFin": "2025-05-30T00:00:00.000Z",
  "tipoLicencia": "VACACIONES",
  "notas": "Vacaciones anuales programadas"
}
```

### Aprobar la solicitud de vacaciones

```
PATCH /api/employee-leaves/1/approve
Authorization: Bearer {token}
```

## Integración con Servicios

El módulo de licencias y vacaciones se integra con el sistema de asignación de servicios para garantizar que no se asignen empleados que estarán ausentes durante el período programado para un servicio.

Cuando se programa un nuevo servicio, el sistema verificará automáticamente si los empleados disponibles tienen licencias o vacaciones programadas para la fecha del servicio, y solo considerará a aquellos que estarán realmente disponibles.

### Ejemplo de flujo integrado:

1. Se programan vacaciones para el empleado Juan Pérez del 15 al 30 de mayo de 2025
2. Se aprueban las vacaciones
3. Se intenta crear un servicio para el 20 de mayo de 2025 que requiere un conductor
4. Aunque Juan Pérez es conductor y actualmente tiene estado "DISPONIBLE", el sistema no lo considerará para este servicio porque estará de vacaciones en esa fecha
