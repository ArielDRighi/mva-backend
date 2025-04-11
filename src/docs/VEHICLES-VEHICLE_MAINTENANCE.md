# Documentación de la API de Vehículos (MVA Backend)

## Índice

1. Introducción
2. Autenticación
3. Endpoints de Vehículos
   - 1. Crear un Vehículo
   - 2. Obtener Todos los Vehículos
   - 3. Obtener un Vehículo Específico
   - 4. Buscar Vehículo por Placa
   - 5. Actualizar un Vehículo
   - 6. Cambiar el Estado de un Vehículo
   - 7. Eliminar un Vehículo
4. Mantenimiento de Vehículos
   - 1. Programar Mantenimiento
   - 2. Completar Mantenimiento
   - 3. Ver Mantenimientos Programados
   - 4. Ver Historial de Mantenimiento
5. Estados de Vehículos
6. Manejo de Errores
7. Ejemplos de Flujos Completos

## Introducción

La API de Vehículos permite gestionar todo el ciclo de vida de los vehículos de la empresa, incluyendo la creación, actualización, cambios de estado, y programación de mantenimientos. Esta API es esencial para administrar la flota vehicular utilizada en los servicios de instalación y mantenimiento de baños químicos.

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

## Endpoints de Vehículos

### 1. Crear un Vehículo

**Endpoint:** `POST /api/vehicles`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "placa": "AB123CD",
  "marca": "Toyota",
  "modelo": "Hilux",
  "anio": 2023,
  "capacidadCarga": 1200,
  "estado": "DISPONIBLE"
}
```

| Campo          | Tipo   | Requerido | Descripción                                         |
| -------------- | ------ | --------- | --------------------------------------------------- |
| placa          | string | Sí        | Matrícula del vehículo, debe ser única              |
| marca          | string | Sí        | Marca del vehículo                                  |
| modelo         | string | Sí        | Modelo del vehículo                                 |
| anio           | number | Sí        | Año de fabricación (mínimo 1900)                    |
| capacidadCarga | number | Sí        | Capacidad de carga en kg (mínimo 0)                 |
| estado         | string | No        | Estado inicial del vehículo (default: "DISPONIBLE") |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 7,
  "placa": "AB123CD",
  "marca": "Toyota",
  "modelo": "Hilux",
  "anio": 2023,
  "capacidadCarga": "1200.00",
  "estado": "DISPONIBLE",
  "maintenanceRecords": []
}
```

### 2. Obtener Todos los Vehículos

**Endpoint:** `GET /api/vehicles`  
**Roles permitidos:** Todos los usuarios autenticados

**Parámetros de consulta opcionales:**

| Parámetro | Tipo   | Descripción                                                                          |
| --------- | ------ | ------------------------------------------------------------------------------------ |
| estado    | string | Filtrar por estado (DISPONIBLE, ASIGNADO, EN_MANTENIMIENTO, FUERA_DE_SERVICIO, BAJA) |

**Ejemplos:**

```
GET /api/vehicles
GET /api/vehicles?estado=DISPONIBLE
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 1,
    "placa": "AA123BB",
    "marca": "Ford",
    "modelo": "F-100",
    "anio": 2020,
    "capacidadCarga": "1500.00",
    "estado": "DISPONIBLE"
  },
  {
    "id": 2,
    "placa": "AC456DD",
    "marca": "Chevrolet",
    "modelo": "S10",
    "anio": 2021,
    "capacidadCarga": "1200.00",
    "estado": "ASIGNADO"
  }
]
```

### 3. Obtener un Vehículo Específico

**Endpoint:** `GET /api/vehicles/{id}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/vehicles/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "placa": "AA123BB",
  "marca": "Ford",
  "modelo": "F-100",
  "anio": 2020,
  "capacidadCarga": "1500.00",
  "estado": "DISPONIBLE",
  "maintenanceRecords": [
    {
      "id": 1,
      "vehiculoId": 1,
      "fechaMantenimiento": "2025-02-15T10:00:00.000Z",
      "tipoMantenimiento": "Preventivo",
      "descripcion": "Cambio de aceite y filtros",
      "costo": "12000.00",
      "proximoMantenimiento": "2025-05-15",
      "completado": true,
      "fechaCompletado": "2025-02-15T15:30:00.000Z"
    }
  ]
}
```

### 4. Buscar Vehículo por Placa

**Endpoint:** `GET /api/vehicles/placa/{placa}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/vehicles/placa/AA123BB
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "placa": "AA123BB",
  "marca": "Ford",
  "modelo": "F-100",
  "anio": 2020,
  "capacidadCarga": "1500.00",
  "estado": "DISPONIBLE"
}
```

### 5. Actualizar un Vehículo

**Endpoint:** `PUT /api/vehicles/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "marca": "Ford",
  "modelo": "F-150",
  "capacidadCarga": 1600
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "placa": "AA123BB",
  "marca": "Ford",
  "modelo": "F-150",
  "anio": 2020,
  "capacidadCarga": "1600.00",
  "estado": "DISPONIBLE"
}
```

### 6. Cambiar el Estado de un Vehículo

**Endpoint:** `PATCH /api/vehicles/{id}/estado`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "estado": "FUERA_DE_SERVICIO"
}
```

**Estados válidos:**

- DISPONIBLE
- ASIGNADO
- EN_MANTENIMIENTO
- FUERA_DE_SERVICIO
- BAJA

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "placa": "AA123BB",
  "marca": "Ford",
  "modelo": "F-100",
  "anio": 2020,
  "capacidadCarga": "1500.00",
  "estado": "FUERA_DE_SERVICIO"
}
```

### 7. Eliminar un Vehículo

**Endpoint:** `DELETE /api/vehicles/{id}`  
**Roles permitidos:** ADMIN

**Ejemplo:**

```
DELETE /api/vehicles/1
```

**Respuesta Exitosa (204 No Content)**

## Mantenimiento de Vehículos

### 1. Programar Mantenimiento

**Endpoint:** `POST /api/vehicle_maintenance`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-06-15T10:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite y filtros",
  "costo": 15000,
  "proximoMantenimiento": "2025-09-15T10:00:00.000Z"
}
```

| Campo                | Tipo               | Requerido | Descripción                                          |
| -------------------- | ------------------ | --------- | ---------------------------------------------------- |
| vehiculoId           | number             | Sí        | ID del vehículo a mantener                           |
| fechaMantenimiento   | string (fecha ISO) | Sí        | Fecha y hora del mantenimiento                       |
| tipoMantenimiento    | string             | Sí        | Tipo de mantenimiento (Preventivo, Correctivo, etc.) |
| descripcion          | string             | No        | Descripción detallada del mantenimiento              |
| costo                | number             | Sí        | Costo estimado del mantenimiento                     |
| proximoMantenimiento | string (fecha ISO) | No        | Fecha recomendada para el próximo mantenimiento      |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 5,
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-06-15T10:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite y filtros",
  "costo": "15000.00",
  "proximoMantenimiento": "2025-09-15",
  "vehicle": {
    "id": 1,
    "placa": "AA123BB",
    "marca": "Ford",
    "modelo": "F-100",
    "anio": 2020,
    "capacidadCarga": "1500.00",
    "estado": "DISPONIBLE"
  },
  "completado": false,
  "fechaCompletado": null
}
```

**Nota:** Si el mantenimiento se programa para la fecha actual o una fecha pasada, el estado del vehículo cambiará automáticamente a "EN_MANTENIMIENTO". Si se programa para una fecha futura, el vehículo permanecerá en su estado actual.

### 2. Completar Mantenimiento

**Endpoint:** `PATCH /api/vehicle_maintenance/{id}/complete`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
PATCH /api/vehicle_maintenance/5/complete
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 5,
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-06-15T10:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite y filtros",
  "costo": "15000.00",
  "proximoMantenimiento": "2025-09-15",
  "vehicle": {
    "id": 1,
    "placa": "AA123BB",
    "marca": "Ford",
    "modelo": "F-100",
    "anio": 2020,
    "capacidadCarga": "1500.00",
    "estado": "DISPONIBLE"
  },
  "completado": true,
  "fechaCompletado": "2025-06-15T15:30:00.000Z"
}
```

### 3. Ver Mantenimientos Programados

**Endpoint:** `GET /api/vehicle_maintenance/upcoming`  
**Roles permitidos:** Todos los usuarios autenticados

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 6,
    "vehiculoId": 2,
    "fechaMantenimiento": "2025-07-20T10:00:00.000Z",
    "tipoMantenimiento": "Preventivo",
    "descripcion": "Revisión general",
    "costo": "10000.00",
    "proximoMantenimiento": "2025-10-20",
    "vehicle": {
      "id": 2,
      "placa": "AC456DD",
      "marca": "Chevrolet",
      "modelo": "S10",
      "anio": 2021,
      "capacidadCarga": "1200.00",
      "estado": "ASIGNADO"
    },
    "completado": false,
    "fechaCompletado": null
  }
]
```

### 4. Ver Historial de Mantenimiento

**Endpoint:** `GET /api/vehicle_maintenance/vehiculo/{id}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/vehicle_maintenance/vehiculo/1
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 1,
    "vehiculoId": 1,
    "fechaMantenimiento": "2025-02-15T10:00:00.000Z",
    "tipoMantenimiento": "Preventivo",
    "descripcion": "Cambio de aceite y filtros",
    "costo": "12000.00",
    "proximoMantenimiento": "2025-05-15",
    "vehicle": {
      "id": 1,
      "placa": "AA123BB",
      "marca": "Ford",
      "modelo": "F-100",
      "anio": 2020,
      "capacidadCarga": "1500.00",
      "estado": "DISPONIBLE"
    },
    "completado": true,
    "fechaCompletado": "2025-02-15T15:30:00.000Z"
  },
  {
    "id": 5,
    "vehiculoId": 1,
    "fechaMantenimiento": "2025-06-15T10:00:00.000Z",
    "tipoMantenimiento": "Preventivo",
    "descripcion": "Cambio de aceite y filtros",
    "costo": "15000.00",
    "proximoMantenimiento": "2025-09-15",
    "vehicle": {
      "id": 1,
      "placa": "AA123BB",
      "marca": "Ford",
      "modelo": "F-100",
      "anio": 2020,
      "capacidadCarga": "1500.00",
      "estado": "DISPONIBLE"
    },
    "completado": true,
    "fechaCompletado": "2025-06-15T15:30:00.000Z"
  }
]
```

## Estados de Vehículos

Los vehículos pueden tener los siguientes estados:

| Estado            | Descripción                                  | Asignable a Servicios |
| ----------------- | -------------------------------------------- | --------------------- |
| DISPONIBLE        | Vehículo listo para ser asignado a servicios | Sí                    |
| ASIGNADO          | Vehículo actualmente asignado a un servicio  | No                    |
| EN_MANTENIMIENTO  | Vehículo en mantenimiento                    | No                    |
| FUERA_DE_SERVICIO | Vehículo temporalmente fuera de servicio     | No                    |
| BAJA              | Vehículo permanentemente fuera de servicio   | No                    |

## Manejo de Errores

### Respuesta de Error (404 Not Found)

```json
{
  "message": "Vehículo con id 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Respuesta de Error (409 Conflict)

```json
{
  "message": "Ya existe un vehículo con la placa AB123CD",
  "error": "Conflict",
  "statusCode": 409
}
```

### Respuesta de Error (400 Bad Request)

```json
{
  "message": "El vehículo no está disponible para mantenimiento. Estado actual: ASIGNADO",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Ejemplos de Flujos Completos

### 1. Ciclo de Vida Básico de un Vehículo

1. **Crear un nuevo vehículo**

   ```
   POST /api/vehicles
   {
     "placa": "AB123CD",
     "marca": "Toyota",
     "modelo": "Hilux",
     "anio": 2023,
     "capacidadCarga": 1200
   }
   ```

2. **Asignar el vehículo a un servicio** (esto ocurre automáticamente a través de la API de Servicios)

3. **Completar el servicio** (el vehículo vuelve a estado "DISPONIBLE" automáticamente)

4. **Programar un mantenimiento**

   ```
   POST /api/vehicle_maintenance
   {
     "vehiculoId": 7,
     "fechaMantenimiento": "2025-07-15T10:00:00.000Z",
     "tipoMantenimiento": "Preventivo",
     "descripcion": "Cambio de aceite y filtros",
     "costo": 15000,
     "proximoMantenimiento": "2025-10-15T10:00:00.000Z"
   }
   ```

5. **Completar el mantenimiento**

   ```
   PATCH /api/vehicle_maintenance/8/complete
   ```

6. **Dar de baja al vehículo cuando ya no se use**
   ```
   PATCH /api/vehicles/7/estado
   {
     "estado": "BAJA"
   }
   ```

### 2. Gestión de Flota de Vehículos

1. **Obtener todos los vehículos disponibles**

   ```
   GET /api/vehicles?estado=DISPONIBLE
   ```

2. **Verificar próximos mantenimientos programados**

   ```
   GET /api/vehicle_maintenance/upcoming
   ```

3. **Ver historial de mantenimiento de un vehículo específico**

   ```
   GET /api/vehicle_maintenance/vehiculo/1
   ```

4. **Actualizar capacidad de carga de un vehículo**
   ```
   PUT /api/vehicles/1
   {
     "capacidadCarga": 1600
   }
   ```

### 3. Mantenimiento No Planificado

1. **Marcar un vehículo como "EN_MANTENIMIENTO"**

   ```
   PATCH /api/vehicles/2/estado
   {
     "estado": "EN_MANTENIMIENTO"
   }
   ```

2. **Registrar el mantenimiento**

   ```
   POST /api/vehicle_maintenance
   {
     "vehiculoId": 2,
     "fechaMantenimiento": "2025-05-10T10:00:00.000Z",
     "tipoMantenimiento": "Correctivo",
     "descripcion": "Reparación del sistema de frenos",
     "costo": 25000
   }
   ```

3. **Completar el mantenimiento**
   ```
   PATCH /api/vehicle_maintenance/10/complete
   ```
   (El vehículo volverá automáticamente al estado "DISPONIBLE")

### Recomendaciones Adicionales

- Antes de eliminar un vehículo, verifique que no tenga servicios asignados ni mantenimientos pendientes
- Para vehículos que requieren reparaciones extensas, use el estado "FUERA_DE_SERVICIO"
- Mantenga actualizados los registros de mantenimiento para asegurar el buen funcionamiento de la flota
