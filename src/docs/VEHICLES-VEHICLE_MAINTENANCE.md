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
  "tipoCabina": "doble",
  "numeroInterno": "VH-001",
  "fechaVencimientoVTV": "2026-05-15",
  "fechaVencimientoSeguro": "2026-01-10",
  "esExterno": false,
  "estado": "DISPONIBLE"
}
```

| Campo                  | Tipo    | Requerido | Descripción                                                |
| ---------------------- | ------- | --------- | ---------------------------------------------------------- |
| placa                  | string  | Sí        | Matrícula del vehículo, debe ser única                     |
| marca                  | string  | Sí        | Marca del vehículo                                         |
| modelo                 | string  | Sí        | Modelo del vehículo                                        |
| anio                   | number  | Sí        | Año de fabricación (mínimo 1900)                           |
| tipoCabina             | string  | No        | Tipo de cabina: "simple" o "doble" (por defecto: "simple") |
| numeroInterno          | string  | No        | Número interno asignado al vehículo                        |
| fechaVencimientoVTV    | string  | No        | Fecha de vencimiento de la VTV (formato: YYYY-MM-DD)       |
| fechaVencimientoSeguro | string  | No        | Fecha de vencimiento del seguro (formato: YYYY-MM-DD)      |
| esExterno              | boolean | No        | Indica si el vehículo es externo (por defecto: false)      |
| estado                 | string  | No        | Estado inicial del vehículo (por defecto: "DISPONIBLE")    |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 7,
  "placa": "AB123CD",
  "marca": "Toyota",
  "modelo": "Hilux",
  "anio": 2023,
  "tipoCabina": "doble",
  "numeroInterno": "VH-001",
  "fechaVencimientoVTV": "2026-05-15",
  "fechaVencimientoSeguro": "2026-01-10",
  "esExterno": false,
  "estado": "DISPONIBLE",
  "maintenanceRecords": []
}
```

## 2. Obtener Vehículos

**Endpoint: GET /api/vehicles**
**Roles permitidos: Todos los usuarios autenticados**
**Descripción: Recupera todos los vehículos registrados en el sistema. Permite filtrar por estado y realizar paginación.**

**Parámetros de consulta opcionales:**

| Parámetro | Tipo   | Descripción                                                                   |
| --------- | ------ | ----------------------------------------------------------------------------- |
| search    | string | Búsqueda parcial por estado del vehículo (no distingue mayúsculas/minúsculas) |
| page      | number | Número de página a recuperar (por defecto: 1)                                 |
| limit     | number | Cantidad de resultados por página (por defecto: 10)                           |

El parámetro search filtra vehículos según el valor del campo estado, que puede ser:
DISPONIBLE, ASIGNADO, EN_MANTENIMIENTO, FUERA_DE_SERVICIO o BAJA.

**Ejemplos:**

```
GET /api/vehicles
GET /api/vehicles?search=disponible
GET /api/vehicles?search=baja&page=2&limit=5
```

**Respuesta Exitosa (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "placa": "AA123BB",
      "marca": "Ford",
      "modelo": "F-100",
      "anio": 2020,
      "tipoCabina": "SIMPLE",
      "numeroInterno": "VH-001",
      "fechaVencimientoVTV": "2026-03-15",
      "fechaVencimientoSeguro": "2026-05-20",
      "esExterno": false,
      "estado": "DISPONIBLE"
    },
    {
      "id": 2,
      "placa": "AC456DD",
      "marca": "Chevrolet",
      "modelo": "S10",
      "anio": 2021,
      "tipoCabina": "DOBLE",
      "numeroInterno": "VH-002",
      "fechaVencimientoVTV": "2026-04-10",
      "fechaVencimientoSeguro": "2026-06-05",
      "esExterno": false,
      "estado": "ASIGNADO"
    }
    // Más vehículos...
  ],
  "totalItems": 12,
  "currentPage": 1,
  "totalPages": 2
}
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
  "tipoCabina": "SIMPLE",
  "numeroInterno": "VH-001",
  "fechaVencimientoVTV": "2026-03-15",
  "fechaVencimientoSeguro": "2026-05-20",
  "esExterno": false,
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
  "tipoCabina": "SIMPLE",
  "numeroInterno": "VH-001",
  "fechaVencimientoVTV": "2026-03-15",
  "fechaVencimientoSeguro": "2026-05-20",
  "esExterno": false,
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
  "tipoCabina": "DOBLE",
  "numeroInterno": "VH-001-A",
  "fechaVencimientoVTV": "2026-06-20",
  "fechaVencimientoSeguro": "2026-07-15"
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
  "tipoCabina": "DOBLE",
  "numeroInterno": "VH-001-A",
  "fechaVencimientoVTV": "2026-06-20",
  "fechaVencimientoSeguro": "2026-07-15",
  "esExterno": false,
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
  "tipoCabina": "SIMPLE",
  "numeroInterno": "VH-001",
  "fechaVencimientoVTV": "2026-03-15",
  "fechaVencimientoSeguro": "2026-05-20",
  "esExterno": false,
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
  "costo": 15000.5,
  "proximoMantenimiento": "2025-09-15"
}
```

| Campo                | Tipo   | Requerido | Descripción                                           |
| -------------------- | ------ | --------- | ----------------------------------------------------- |
| vehiculoId           | number | Sí        | ID del vehículo                                       |
| fechaMantenimiento   | string | Sí        | Fecha y hora programada (formato ISO)                 |
| tipoMantenimiento    | string | Sí        | Tipo de mantenimiento (Preventivo, Correctivo, etc.)  |
| descripcion          | string | Sí        | Descripción del mantenimiento                         |
| costo                | number | No        | Costo estimado del mantenimiento                      |
| proximoMantenimiento | string | No        | Fecha estimada del próximo mantenimiento (YYYY-MM-DD) |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 3,
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-06-15T10:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite y filtros",
  "costo": "15000.50",
  "proximoMantenimiento": "2025-09-15",
  "completado": false,
  "fechaCompletado": null
}
```

### 2. Completar Mantenimiento

**Endpoint:** `PATCH /api/vehicle_maintenance/{id}/complete`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
PATCH /api/vehicle_maintenance/3/complete
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 3,
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-06-15T10:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite y filtros",
  "costo": "15000.50",
  "proximoMantenimiento": "2025-09-15",
  "completado": true,
  "fechaCompletado": "2025-06-15T14:30:00.000Z"
}
```

### 3. Ver Mantenimientos Programados

**Endpoint:** `GET /api/vehicle_maintenance/upcoming`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/vehicle_maintenance/upcoming
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 4,
    "vehiculoId": 2,
    "fechaMantenimiento": "2025-06-20T09:00:00.000Z",
    "tipoMantenimiento": "Preventivo",
    "descripcion": "Revisión general",
    "costo": "8000.00",
    "proximoMantenimiento": "2025-09-20",
    "completado": false,
    "fechaCompletado": null,
    "vehiculo": {
      "id": 2,
      "placa": "AC456DD",
      "marca": "Chevrolet",
      "modelo": "S10"
    }
  },
  {
    "id": 5,
    "vehiculoId": 3,
    "fechaMantenimiento": "2025-06-22T11:00:00.000Z",
    "tipoMantenimiento": "Correctivo",
    "descripcion": "Reparación de frenos",
    "costo": "12500.00",
    "proximoMantenimiento": null,
    "completado": false,
    "fechaCompletado": null,
    "vehiculo": {
      "id": 3,
      "placa": "DE789FF",
      "marca": "Toyota",
      "modelo": "Hilux"
    }
  }
]
```

### 4. Ver Todos los Mantenimientos

**Endpoint:** `GET /api/vehicle_maintenance`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/vehicle_maintenance
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
    "completado": true,
    "fechaCompletado": "2025-02-15T15:30:00.000Z"
  },
  {
    "id": 2,
    "vehiculoId": 1,
    "fechaMantenimiento": "2025-05-15T11:00:00.000Z",
    "tipoMantenimiento": "Preventivo",
    "descripcion": "Cambio de correas",
    "costo": "9500.00",
    "proximoMantenimiento": "2025-08-15",
    "completado": true,
    "fechaCompletado": "2025-05-15T14:45:00.000Z"
  }
  // Más registros...
]
```

### 5. Ver Mantenimiento Específico

**Endpoint:** `GET /api/vehicle_maintenance/{id}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/vehicle_maintenance/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-02-15T10:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite y filtros",
  "costo": "12000.00",
  "proximoMantenimiento": "2025-05-15",
  "completado": true,
  "fechaCompletado": "2025-02-15T15:30:00.000Z",
  "vehiculo": {
    "id": 1,
    "placa": "AA123BB",
    "marca": "Ford",
    "modelo": "F-100"
  }
}
```

### 6. Ver Mantenimientos por Vehículo

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
    "completado": true,
    "fechaCompletado": "2025-02-15T15:30:00.000Z"
  },
  {
    "id": 2,
    "vehiculoId": 1,
    "fechaMantenimiento": "2025-05-15T11:00:00.000Z",
    "tipoMantenimiento": "Preventivo",
    "descripcion": "Cambio de correas",
    "costo": "9500.00",
    "proximoMantenimiento": "2025-08-15",
    "completado": true,
    "fechaCompletado": "2025-05-15T14:45:00.000Z"
  }
]
```

### 7. Actualizar Mantenimiento

**Endpoint:** `PUT /api/vehicle_maintenance/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "fechaMantenimiento": "2025-06-18T14:00:00.000Z",
  "tipoMantenimiento": "Preventivo Completo",
  "descripcion": "Cambio de aceite, filtros y revisión de frenos",
  "costo": 18000.75
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 3,
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-06-18T14:00:00.000Z",
  "tipoMantenimiento": "Preventivo Completo",
  "descripcion": "Cambio de aceite, filtros y revisión de frenos",
  "costo": "18000.75",
  "proximoMantenimiento": "2025-09-15",
  "completado": false,
  "fechaCompletado": null
}
```

### 8. Eliminar Mantenimiento

**Endpoint:** `DELETE /api/vehicle_maintenance/{id}`  
**Roles permitidos:** ADMIN

**Ejemplo:**

```
DELETE /api/vehicle_maintenance/6
```

**Respuesta Exitosa (204 No Content)**

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
     "tipoCabina": "DOBLE",
     "numeroInterno": "VH-010",
     "fechaVencimientoVTV": "2026-05-15",
     "fechaVencimientoSeguro": "2026-01-10",
     "esExterno": false
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
   GET /api/vehicles?search=DISPONIBLE
   ```

2. **Verificar próximos mantenimientos programados**

   ```
   GET /api/vehicle_maintenance/upcoming
   ```

3. **Ver historial de mantenimiento de un vehículo específico**

   ```
   GET /api/vehicle_maintenance/vehiculo/1
   ```

4. **Actualizar tipo de cabina de un vehículo**
   ```
   PUT /api/vehicles/1
   {
     "tipoCabina": "DOBLE"
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
