# Documentación de la API de Baños Químicos (MVA Backend)

## Índice

1. Introducción
2. Autenticación
3. Endpoints de Baños Químicos
   - 1. Crear un Baño Químico
   - 2. Obtener Todos los Baños Químicos
   - 3. Buscar Baños Químicos con Filtros
   - 4. Obtener un Baño Químico Específico
   - 5. Actualizar un Baño Químico
   - 6. Eliminar un Baño Químico
   - 7. Obtener Estadísticas de Mantenimiento
4. Mantenimiento de Baños Químicos
   - 1. Programar un Mantenimiento
   - 2. Obtener Todos los Mantenimientos
   - 3. Buscar Mantenimientos con Filtros
   - 4. Obtener un Mantenimiento Específico
   - 5. Actualizar un Mantenimiento
   - 6. Completar un Mantenimiento
   - 7. Eliminar un Mantenimiento
5. Estados de Baños Químicos
6. Manejo de Errores
7. Ejemplos de Flujos Completos

## Introducción

La API de Baños Químicos permite gestionar el inventario completo de baños químicos de la empresa, incluyendo la creación, actualización, cambios de estado, y programación de mantenimientos. Esta API es fundamental para la administración de los recursos que se asignan a los servicios ofrecidos a los clientes.

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

## Endpoints de Baños Químicos

### 1. Crear un Baño Químico

**Endpoint:** `POST /api/chemical_toilets`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "codigo_interno": "BQ-2023-001",
  "modelo": "Standard",
  "fecha_adquisicion": "2023-05-15T10:00:00.000Z",
  "estado": "DISPONIBLE"
}
```

| Campo             | Tipo               | Requerido | Descripción                                                   |
| ----------------- | ------------------ | --------- | ------------------------------------------------------------- |
| codigo_interno    | string             | Sí        | Código único para identificar el baño                         |
| modelo            | string             | Sí        | Modelo del baño químico                                       |
| fecha_adquisicion | string (fecha ISO) | Sí        | Fecha de compra o adquisición                                 |
| estado            | string             | Sí        | Estado inicial del baño (DISPONIBLE, FUERA_DE_SERVICIO, etc.) |

**Respuesta Exitosa (201 Created):**

```json
{
  "baño_id": 10,
  "codigo_interno": "BQ-2023-001",
  "modelo": "Standard",
  "fecha_adquisicion": "2023-05-15T10:00:00.000Z",
  "estado": "DISPONIBLE",
  "maintenances": []
}
```

### 2. Obtener Todos los Baños Químicos

**Endpoint:** `GET /api/chemical_toilets`  
**Roles permitidos:** Todos los usuarios autenticados

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "baño_id": 1,
    "codigo_interno": "BQ-2020-001",
    "modelo": "Standard",
    "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
    "estado": "DISPONIBLE"
  },
  {
    "baño_id": 2,
    "codigo_interno": "BQ-2020-002",
    "modelo": "Premium",
    "fecha_adquisicion": "2020-02-20T10:00:00.000Z",
    "estado": "ASIGNADO"
  }
]
```

### 3. Buscar Baños Químicos con Filtros

**Endpoint:** `GET /api/chemical_toilets/search`  
**Roles permitidos:** Todos los usuarios autenticados

**Parámetros de consulta opcionales:**

| Parámetro     | Tipo               | Descripción                                                       |
| ------------- | ------------------ | ----------------------------------------------------------------- |
| estado        | string             | Filtrar por estado (DISPONIBLE, ASIGNADO, EN_MANTENIMIENTO, etc.) |
| modelo        | string             | Filtrar por modelo (búsqueda parcial)                             |
| codigoInterno | string             | Filtrar por código interno (búsqueda parcial)                     |
| fechaDesde    | string (fecha ISO) | Filtrar por fecha de adquisición desde                            |
| fechaHasta    | string (fecha ISO) | Filtrar por fecha de adquisición hasta                            |

**Ejemplos:**

```
GET /api/chemical_toilets/search?estado=DISPONIBLE
GET /api/chemical_toilets/search?modelo=Premium
GET /api/chemical_toilets/search?fechaDesde=2020-01-01T00:00:00.000Z&fechaHasta=2021-01-01T00:00:00.000Z
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "baño_id": 1,
    "codigo_interno": "BQ-2020-001",
    "modelo": "Standard",
    "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
    "estado": "DISPONIBLE"
  }
]
```

### 4. Obtener un Baño Químico Específico

**Endpoint:** `GET /api/chemical_toilets/{id}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/chemical_toilets/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "baño_id": 1,
  "codigo_interno": "BQ-2020-001",
  "modelo": "Standard",
  "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
  "estado": "DISPONIBLE"
}
```

### 5. Actualizar un Baño Químico

**Endpoint:** `PUT /api/chemical_toilets/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "modelo": "Premium Plus",
  "estado": "DISPONIBLE"
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

**Respuesta Exitosa (200 OK):**

```json
{
  "baño_id": 1,
  "codigo_interno": "BQ-2020-001",
  "modelo": "Premium Plus",
  "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
  "estado": "DISPONIBLE"
}
```

### 6. Eliminar un Baño Químico

**Endpoint:** `DELETE /api/chemical_toilets/{id}`  
**Roles permitidos:** ADMIN

**Ejemplo:**

```
DELETE /api/chemical_toilets/1
```

**Respuesta Exitosa (204 No Content)**

### 7. Obtener Estadísticas de Mantenimiento

**Endpoint:** `GET /api/chemical_toilets/stats/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Ejemplo:**

```
GET /api/chemical_toilets/stats/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "totalMaintenances": 5,
  "totalCost": 45000,
  "lastMaintenance": {
    "fecha": "2023-07-15T10:00:00.000Z",
    "tipo": "Preventivo",
    "tecnico": "Juan Pérez"
  },
  "daysSinceLastMaintenance": 45
}
```

## Mantenimiento de Baños Químicos

### 1. Programar un Mantenimiento

**Endpoint:** `POST /api/toilet_maintenance`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "baño_id": 1,
  "fecha_mantenimiento": "2025-05-20T10:00:00.000Z",
  "tipo_mantenimiento": "Preventivo",
  "descripcion": "Limpieza general y desinfección",
  "tecnico_responsable": "Juan Pérez",
  "costo": 5000
}
```

| Campo               | Tipo               | Requerido | Descripción                                          |
| ------------------- | ------------------ | --------- | ---------------------------------------------------- |
| baño_id             | number             | Sí        | ID del baño a mantener                               |
| fecha_mantenimiento | string (fecha ISO) | Sí        | Fecha y hora del mantenimiento                       |
| tipo_mantenimiento  | string             | Sí        | Tipo de mantenimiento (Preventivo, Correctivo, etc.) |
| descripcion         | string             | Sí        | Descripción detallada del mantenimiento              |
| tecnico_responsable | string             | Sí        | Nombre del técnico responsable                       |
| costo               | number             | Sí        | Costo estimado del mantenimiento                     |

**Respuesta Exitosa (201 Created):**

```json
{
  "mantenimiento_id": 8,
  "fecha_mantenimiento": "2025-05-20T10:00:00.000Z",
  "tipo_mantenimiento": "Preventivo",
  "descripcion": "Limpieza general y desinfección",
  "tecnico_responsable": "Juan Pérez",
  "costo": "5000.00",
  "toilet": {
    "baño_id": 1,
    "codigo_interno": "BQ-2020-001",
    "modelo": "Standard",
    "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
    "estado": "DISPONIBLE"
  },
  "completado": false,
  "fechaCompletado": null
}
```

**Nota:** Si el mantenimiento se programa para la fecha actual o una fecha pasada, el estado del baño cambiará automáticamente a "EN_MANTENIMIENTO". Si se programa para una fecha futura, el baño permanecerá en su estado actual.

### 2. Obtener Todos los Mantenimientos

**Endpoint:** `GET /api/toilet_maintenance`  
**Roles permitidos:** Todos los usuarios autenticados

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "mantenimiento_id": 1,
    "fecha_mantenimiento": "2025-03-15T10:00:00.000Z",
    "tipo_mantenimiento": "Preventivo",
    "descripcion": "Limpieza general",
    "tecnico_responsable": "Juan Pérez",
    "costo": "3000.00",
    "toilet": {
      "baño_id": 1,
      "codigo_interno": "BQ-2020-001",
      "modelo": "Standard",
      "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
      "estado": "DISPONIBLE"
    },
    "completado": true,
    "fechaCompletado": "2025-03-15T15:30:00.000Z"
  },
  {
    "mantenimiento_id": 8,
    "fecha_mantenimiento": "2025-05-20T10:00:00.000Z",
    "tipo_mantenimiento": "Preventivo",
    "descripcion": "Limpieza general y desinfección",
    "tecnico_responsable": "Juan Pérez",
    "costo": "5000.00",
    "toilet": {
      "baño_id": 1,
      "codigo_interno": "BQ-2020-001",
      "modelo": "Standard",
      "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
      "estado": "DISPONIBLE"
    },
    "completado": false,
    "fechaCompletado": null
  }
]
```

### 3. Buscar Mantenimientos con Filtros

**Endpoint:** `GET /api/toilet_maintenance/search`  
**Roles permitidos:** Todos los usuarios autenticados

**Parámetros de consulta opcionales:**

| Parámetro           | Tipo               | Descripción                                          |
| ------------------- | ------------------ | ---------------------------------------------------- |
| baño_id             | number             | Filtrar por ID del baño                              |
| tipo_mantenimiento  | string             | Filtrar por tipo de mantenimiento (búsqueda parcial) |
| tecnico_responsable | string             | Filtrar por técnico responsable (búsqueda parcial)   |
| fechaDesde          | string (fecha ISO) | Filtrar por fecha de mantenimiento desde             |
| fechaHasta          | string (fecha ISO) | Filtrar por fecha de mantenimiento hasta             |

**Ejemplos:**

```
GET /api/toilet_maintenance/search?baño_id=1
GET /api/toilet_maintenance/search?tipo_mantenimiento=Preventivo
GET /api/toilet_maintenance/search?fechaDesde=2025-01-01T00:00:00.000Z&fechaHasta=2025-06-01T00:00:00.000Z
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "mantenimiento_id": 1,
    "fecha_mantenimiento": "2025-03-15T10:00:00.000Z",
    "tipo_mantenimiento": "Preventivo",
    "descripcion": "Limpieza general",
    "tecnico_responsable": "Juan Pérez",
    "costo": "3000.00",
    "toilet": {
      "baño_id": 1,
      "codigo_interno": "BQ-2020-001",
      "modelo": "Standard",
      "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
      "estado": "DISPONIBLE"
    },
    "completado": true,
    "fechaCompletado": "2025-03-15T15:30:00.000Z"
  }
]
```

### 4. Obtener un Mantenimiento Específico

**Endpoint:** `GET /api/toilet_maintenance/{id}`  
**Roles permitidos:** Todos los usuarios autenticados

**Ejemplo:**

```
GET /api/toilet_maintenance/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "mantenimiento_id": 1,
  "fecha_mantenimiento": "2025-03-15T10:00:00.000Z",
  "tipo_mantenimiento": "Preventivo",
  "descripcion": "Limpieza general",
  "tecnico_responsable": "Juan Pérez",
  "costo": "3000.00",
  "toilet": {
    "baño_id": 1,
    "codigo_interno": "BQ-2020-001",
    "modelo": "Standard",
    "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
    "estado": "DISPONIBLE"
  },
  "completado": true,
  "fechaCompletado": "2025-03-15T15:30:00.000Z"
}
```

### 5. Actualizar un Mantenimiento

**Endpoint:** `PUT /api/toilet_maintenance/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "descripcion": "Limpieza general y reparación de puerta",
  "costo": 6000,
  "tecnico_responsable": "Carlos Gómez"
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

**Respuesta Exitosa (200 OK):**

```json
{
  "mantenimiento_id": 1,
  "fecha_mantenimiento": "2025-03-15T10:00:00.000Z",
  "tipo_mantenimiento": "Preventivo",
  "descripcion": "Limpieza general y reparación de puerta",
  "tecnico_responsable": "Carlos Gómez",
  "costo": "6000.00",
  "toilet": {
    "baño_id": 1,
    "codigo_interno": "BQ-2020-001",
    "modelo": "Standard",
    "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
    "estado": "DISPONIBLE"
  },
  "completado": true,
  "fechaCompletado": "2025-03-15T15:30:00.000Z"
}
```

### 6. Completar un Mantenimiento

**Endpoint:** `PATCH /api/toilet_maintenance/{id}/complete`  
**Roles permitidos:** ADMIN, SUPERVISOR

Este endpoint marca un mantenimiento como completado y cambia el estado del baño a "DISPONIBLE".

**Ejemplo:**

```
PATCH /api/toilet_maintenance/8/complete
```

**Respuesta Exitosa (200 OK):**

```json
{
  "mantenimiento_id": 8,
  "fecha_mantenimiento": "2025-05-20T10:00:00.000Z",
  "tipo_mantenimiento": "Preventivo",
  "descripcion": "Limpieza general y desinfección",
  "tecnico_responsable": "Juan Pérez",
  "costo": "5000.00",
  "toilet": {
    "baño_id": 1,
    "codigo_interno": "BQ-2020-001",
    "modelo": "Standard",
    "fecha_adquisicion": "2020-01-15T10:00:00.000Z",
    "estado": "DISPONIBLE"
  },
  "completado": true,
  "fechaCompletado": "2025-05-20T15:30:00.000Z"
}
```

### 7. Eliminar un Mantenimiento

**Endpoint:** `DELETE /api/toilet_maintenance/{id}`  
**Roles permitidos:** ADMIN

**Ejemplo:**

```
DELETE /api/toilet_maintenance/8
```

**Respuesta Exitosa (204 No Content)**

## Estados de Baños Químicos

Los baños químicos pueden tener los siguientes estados:

| Estado            | Descripción                              | Asignable a Servicios |
| ----------------- | ---------------------------------------- | --------------------- |
| DISPONIBLE        | Baño listo para ser asignado a servicios | Sí                    |
| ASIGNADO          | Baño actualmente asignado a un servicio  | No                    |
| EN_MANTENIMIENTO  | Baño en mantenimiento                    | No                    |
| FUERA_DE_SERVICIO | Baño temporalmente fuera de servicio     | No                    |
| BAJA              | Baño permanentemente fuera de servicio   | No                    |

## Manejo de Errores

### Respuesta de Error (404 Not Found)

```json
{
  "message": "Baño químico con ID 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Respuesta de Error (400 Bad Request)

```json
{
  "message": "El baño químico no está disponible para mantenimiento. Estado actual: ASIGNADO",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Ejemplos de Flujos Completos

### 1. Ciclo de Vida Básico de un Baño Químico

1. **Crear un nuevo baño químico**

   ```
   POST /api/chemical_toilets
   {
     "codigo_interno": "BQ-2023-005",
     "modelo": "Premium",
     "fecha_adquisicion": "2023-08-15T10:00:00.000Z",
     "estado": "DISPONIBLE"
   }
   ```

2. **Asignar el baño a un servicio** (esto ocurre automáticamente a través de la API de Servicios)

3. **Completar el servicio** (el baño vuelve a estado "DISPONIBLE" automáticamente)

4. **Programar un mantenimiento**

   ```
   POST /api/toilet_maintenance
   {
     "baño_id": 10,
     "fecha_mantenimiento": "2025-06-15T10:00:00.000Z",
     "tipo_mantenimiento": "Preventivo",
     "descripcion": "Limpieza general y desinfección",
     "tecnico_responsable": "Juan Pérez",
     "costo": 5000
   }
   ```

5. **Completar el mantenimiento**

   ```
   PATCH /api/toilet_maintenance/9/complete
   ```

6. **Dar de baja al baño cuando ya no se use**
   ```
   PUT /api/chemical_toilets/10
   {
     "estado": "BAJA"
   }
   ```

### 2. Gestión de Inventario de Baños Químicos

1. **Obtener todos los baños disponibles**

   ```
   GET /api/chemical_toilets/search?estado=DISPONIBLE
   ```

2. **Verificar estadísticas de mantenimiento**

   ```
   GET /api/chemical_toilets/stats/1
   ```

3. **Actualizar modelo de un baño**
   ```
   PUT /api/chemical_toilets/1
   {
     "modelo": "Ultra Premium"
   }
   ```

### 3. Mantenimiento No Planificado

1. **Marcar un baño como "EN_MANTENIMIENTO"**

   ```
   PUT /api/chemical_toilets/2
   {
     "estado": "EN_MANTENIMIENTO"
   }
   ```

2. **Registrar el mantenimiento**

   ```
   POST /api/toilet_maintenance
   {
     "baño_id": 2,
     "fecha_mantenimiento": "2025-05-10T10:00:00.000Z",
     "tipo_mantenimiento": "Correctivo",
     "descripcion": "Reparación de puerta dañada",
     "tecnico_responsable": "Roberto Sánchez",
     "costo": 8000
   }
   ```

3. **Completar el mantenimiento**
   ```
   PATCH /api/toilet_maintenance/10/complete
   ```
   (El baño volverá automáticamente al estado "DISPONIBLE")

### Recomendaciones Adicionales

- Antes de eliminar un baño químico, verifique que no tenga servicios asignados ni mantenimientos pendientes
- Para baños que requieren reparaciones extensas, use el estado "FUERA_DE_SERVICIO"
- Mantenga actualizados los registros de mantenimiento para asegurar el buen funcionamiento de los baños
