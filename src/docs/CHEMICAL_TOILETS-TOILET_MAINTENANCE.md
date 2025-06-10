# Documentación de los Módulos de Baños Químicos| Atributo | Tipo | Descripción |

| ------------------- | -------------- | ---------------------------------------------------- |
| mantenimiento_id | number | Identificador único del mantenimiento |
| fecha_mantenimie| Campo | Tipo | Requerido | Descripción |
| ------------------- | ------ | --------- | ----------------------- |
| toilet_id | number | Sí | ID del baño químico |
| tipo_mantenimiento | string | Sí | Tipo de mantenimiento |
| descripcion | string | Sí | Descripción detallada |
| tecnico_responsable | string | Sí | Nombre del técnico |
| costo | number | No | Costo del mantenimiento |ate | Fecha en que se realizó o programó el mantenimiento |
| tipo_mantenimiento | string | Tipo de mantenimiento (Preventivo, Correctivo, etc.) |
| descripcion | string | Descripción detallada del mantenimiento |
| tecnico_responsable | string | Nombre del técnico encargado del mantenimiento |
| costo | number (opcional) | Costo del mantenimiento |nimiento (MVA Backend)

## Índice

1. Introducción
2. Estructura de Datos
   - 1. Baños Químicos
   - 2. Mantenimiento de Baños
3. Endpoints de Baños Químicos
   - 1. Crear Baño Químico
   - 2. Obtener Todos los Baños
   - 3. Búsqueda Avanzada de Baños
   - 4. Obtener Baño por ID
   - 5. Actualizar Baño
   - 6. Eliminar Baño
   - 7. Obtener Estadísticas de Mantenimiento
   - 8. Obtener Baños por Cliente
4. Endpoints de Mantenimiento
   - 1. Registrar Mantenimiento
   - 2. Obtener Mantenimientos de un Baño
   - 3. Marcar Mantenimiento como Completado
   - 4. Actualizar Datos de Mantenimiento
5. Ejemplos de Uso
6. Manejo de Errores

## 1. Introducción

Los módulos de Baños Químicos y Mantenimiento permiten gestionar el inventario de baños químicos de la empresa y llevar un registro detallado de sus mantenimientos. Esta documentación describe los endpoints disponibles y la estructura de datos implementada.

## 2. Estructura de Datos

### 1. Baños Químicos

La entidad `ChemicalToilet` está definida con los siguientes campos:

| Atributo          | Tipo                | Descripción                                          |
| ----------------- | ------------------- | ---------------------------------------------------- |
| baño_id           | number              | Identificador único del baño químico                 |
| codigo_interno    | string              | Código interno para identificación del baño          |
| modelo            | string              | Modelo o tipo de baño químico                        |
| fecha_adquisicion | Date                | Fecha en que se adquirió el baño                     |
| estado            | string              | Estado actual del baño (Activo, En Reparación, etc.) |
| maintenances      | ToiletMaintenance[] | Relación con los mantenimientos realizados           |

### 2. Mantenimiento de Baños

La entidad `ToiletMaintenance` está definida con los siguientes campos:

| Atributo            | Tipo              | Descripción                                          |
| ------------------- | ----------------- | ---------------------------------------------------- |
| mantenimiento_id    | number            | Identificador único del mantenimiento                |
| fecha_mantenimiento | Date              | Fecha en que se realizó o programó el mantenimiento  |
| tipo_mantenimiento  | string            | Tipo de mantenimiento (Preventivo, Correctivo, etc.) |
| descripcion         | string            | Descripción detallada del mantenimiento              |
| tecnico_responsable | string            | Nombre del técnico encargado del mantenimiento       |
| costo               | number (opcional) | Costo del mantenimiento                              |
| toilet              | ChemicalToilet    | Relación con el baño químico                         |
| completado          | boolean           | Indica si el mantenimiento ha sido completado        |
| fechaCompletado     | Date              | Fecha en que se completó el mantenimiento            |

## 3. Endpoints de Baños Químicos

### 1. Crear Baño Químico

**Endpoint:** `POST /api/chemical_toilets`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Crea un nuevo registro de baño químico.

**Request Body:**

```json
{
  "codigo_interno": "BQ-2025-001",
  "modelo": "Standard Plus",
  "fecha_adquisicion": "2025-01-15",
  "estado": "Activo"
}
```

| Campo             | Tipo   | Requerido | Descripción             |
| ----------------- | ------ | --------- | ----------------------- |
| codigo_interno    | string | Sí        | Código interno del baño |
| modelo            | string | Sí        | Modelo del baño químico |
| fecha_adquisicion | Date   | Sí        | Fecha de adquisición    |
| estado            | string | Sí        | Estado inicial del baño |

**Respuesta Exitosa (201 Created):**

```json
{
  "baño_id": 42,
  "codigo_interno": "BQ-2025-001",
  "modelo": "Standard Plus",
  "fecha_adquisicion": "2025-01-15T00:00:00.000Z",
  "estado": "Activo",
  "maintenances": []
}
```

### 2. Obtener Todos los Baños

**Endpoint:** `GET /api/chemical_toilets`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO  
**Descripción:** Recupera la lista de baños químicos con soporte para paginación y búsqueda por texto.

**Parámetros de consulta:**
| Parámetro | Tipo | Requerido | Descripción |
| --------- | ------ | --------- | ------------------------------------------------------------------------------ |
| page | number | No | Número de página a recuperar (valor predeterminado: 1) |
| limit | number | No | Cantidad de elementos por página (valor predeterminado: 10) |
| search | string | No | Texto para buscar coincidencias en modelo, estado o código interno |

**Respuesta Exitosa (200 OK):**

```json
{
  "items": [
    {
      "baño_id": 42,
      "codigo_interno": "BQ-2025-001",
      "modelo": "Standard Plus",
      "fecha_adquisicion": "2025-01-15T00:00:00.000Z",
      "estado": "Activo"
    },
    {
      "baño_id": 41,
      "codigo_interno": "BQ-2024-128",
      "modelo": "Premium",
      "fecha_adquisicion": "2024-12-10T00:00:00.000Z",
      "estado": "En Reparación"
    }
    // Más baños...
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### 3. Búsqueda Avanzada de Baños

**Endpoint:** `GET /api/chemical_toilets/search`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO  
**Descripción:** Permite buscar baños químicos utilizando múltiples filtros.

**Parámetros de consulta:**
| Parámetro | Tipo | Requerido | Descripción |
| -------------- | ------ | --------- | --------------------------------------------------------- |
| page | number | No | Número de página a recuperar (valor predeterminado: 1) |
| limit | number | No | Cantidad de elementos por página (predeterminado: 10) |
| estado | string | No | Filtrar por estado del baño |
| modelo | string | No | Filtrar por modelo del baño |
| codigoInterno | string | No | Filtrar por código interno |
| fechaDesde | date | No | Filtrar por fecha de adquisición desde |
| fechaHasta | date | No | Filtrar por fecha de adquisición hasta |

**Respuesta Exitosa (200 OK):**

```json
{
  "items": [
    {
      "baño_id": 42,
      "codigo_interno": "BQ-2025-001",
      "modelo": "Standard Plus",
      "fecha_adquisicion": "2025-01-15T00:00:00.000Z",
      "estado": "Activo"
    }
    // Más baños filtrados...
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 4. Obtener Baño por ID

**Endpoint:** `GET /api/chemical_toilets/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO  
**Descripción:** Recupera información detallada de un baño químico específico, incluyendo sus mantenimientos.

**Ejemplo:**

```
GET /api/chemical_toilets/42
```

**Respuesta Exitosa (200 OK):**

```json
{
  "baño_id": 42,
  "codigo_interno": "BQ-2025-001",
  "modelo": "Standard Plus",
  "fecha_adquisicion": "2025-01-15T00:00:00.000Z",
  "estado": "Activo",
  "maintenances": [
    {
      "mantenimiento_id": 105,
      "fecha_mantenimiento": "2025-03-15T10:30:00.000Z",
      "tipo_mantenimiento": "Preventivo",
      "descripcion": "Limpieza general y desinfección",
      "tecnico_responsable": "Carlos Gómez",
      "costo": 5000.0,
      "completado": true,
      "fechaCompletado": "2025-03-15T15:45:00.000Z"
    }
  ]
}
```

### 5. Actualizar Baño

**Endpoint:** `PUT /api/chemical_toilets/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza la información de un baño químico existente.

**Request Body:**

```json
{
  "estado": "En Mantenimiento"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "baño_id": 42,
  "codigo_interno": "BQ-2025-001",
  "modelo": "Standard Plus",
  "fecha_adquisicion": "2025-01-15T00:00:00.000Z",
  "estado": "En Mantenimiento"
}
```

### 6. Eliminar Baño

**Endpoint:** `DELETE /api/chemical_toilets/{id}`  
**Roles permitidos:** ADMIN  
**Descripción:** Elimina un baño químico del sistema. No se pueden eliminar baños asignados a servicios o con mantenimientos pendientes.

**Ejemplo:**

```
DELETE /api/chemical_toilets/42
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Baño químico eliminado correctamente"
}
```

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "El baño químico no puede ser eliminado ya que se encuentra asignado a uno o más servicios.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 7. Obtener Estadísticas de Mantenimiento

**Endpoint:** `GET /api/chemical_toilets/stats/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Proporciona estadísticas sobre los mantenimientos realizados a un baño específico.

**Ejemplo:**

```
GET /api/chemical_toilets/stats/42
```

**Respuesta Exitosa (200 OK):**

```json
{
  "totalMaintenances": 5,
  "totalCost": 28500.0,
  "lastMaintenance": {
    "fecha": "2025-03-15T10:30:00.000Z",
    "tipo": "Preventivo",
    "tecnico": "Carlos Gómez"
  },
  "daysSinceLastMaintenance": 53
}
```

### 8. Obtener Baños por Cliente

**Endpoint:** `GET /api/chemical_toilets/by-client/{clientId}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Recupera todos los baños químicos en estado "ASIGNADO" que están vinculados a un cliente específico.

**Ejemplo:**

```
GET /api/chemical_toilets/by-client/5
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "baño_id": 42,
    "codigo_interno": "BQ-2025-001",
    "modelo": "Standard Plus",
    "fecha_adquisicion": "2025-01-15T00:00:00.000Z",
    "estado": "ASIGNADO"
  },
  {
    "baño_id": 43,
    "codigo_interno": "BQ-2025-002",
    "modelo": "Premium",
    "fecha_adquisicion": "2025-01-20T00:00:00.000Z",
    "estado": "ASIGNADO"
  }
]
```

## 4. Endpoints de Mantenimiento

### 1. Registrar Mantenimiento

**Endpoint:** `POST /api/toilet-maintenance`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO  
**Descripción:** Registra un nuevo mantenimiento para un baño químico.

**Request Body:**

```json
{
  "toilet_id": 42,
  "tipo_mantenimiento": "Correctivo",
  "descripcion": "Reparación de válvula de descarga",
  "tecnico_responsable": "Juan Pérez",
  "costo": 8500.0
}
```

| Campo               | Tipo   | Requerido | Descripción             |
| ------------------- | ------ | --------- | ----------------------- |
| toilet_id           | number | Sí        | ID del baño químico     |
| tipo_mantenimiento  | string | Sí        | Tipo de mantenimiento   |
| descripcion         | string | Sí        | Descripción detallada   |
| tecnico_responsable | string | Sí        | Nombre del técnico      |
| costo               | number | No        | Costo del mantenimiento |

**Respuesta Exitosa (201 Created):**

```json
{
  "mantenimiento_id": 106,
  "fecha_mantenimiento": "2025-05-07T16:20:00.000Z",
  "tipo_mantenimiento": "Correctivo",
  "descripcion": "Reparación de válvula de descarga",
  "tecnico_responsable": "Juan Pérez",
  "costo": 8500.0,
  "toilet": {
    "baño_id": 42,
    "codigo_interno": "BQ-2025-001"
  },
  "completado": false,
  "fechaCompletado": null
}
```

### 2. Obtener Mantenimientos de un Baño

**Endpoint:** `GET /api/toilet-maintenance/toilet/{toilet_id}`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO  
**Descripción:** Recupera todos los mantenimientos realizados a un baño específico.

**Ejemplo:**

```
GET /api/toilet-maintenance/toilet/42
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "mantenimiento_id": 105,
    "fecha_mantenimiento": "2025-03-15T10:30:00.000Z",
    "tipo_mantenimiento": "Preventivo",
    "descripcion": "Limpieza general y desinfección",
    "tecnico_responsable": "Carlos Gómez",
    "costo": 5000.0,
    "completado": true,
    "fechaCompletado": "2025-03-15T15:45:00.000Z"
  },
  {
    "mantenimiento_id": 106,
    "fecha_mantenimiento": "2025-05-07T16:20:00.000Z",
    "tipo_mantenimiento": "Correctivo",
    "descripcion": "Reparación de válvula de descarga",
    "tecnico_responsable": "Juan Pérez",
    "costo": 8500.0,
    "completado": false,
    "fechaCompletado": null
  }
]
```

### 3. Marcar Mantenimiento como Completado

**Endpoint:** `PATCH /api/toilet-maintenance/{id}/complete`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO  
**Descripción:** Marca un mantenimiento como completado.

**Respuesta Exitosa (200 OK):**

```json
{
  "mantenimiento_id": 106,
  "fecha_mantenimiento": "2025-05-07T16:20:00.000Z",
  "tipo_mantenimiento": "Correctivo",
  "descripcion": "Reparación de válvula de descarga",
  "tecnico_responsable": "Juan Pérez",
  "costo": 8500.0,
  "completado": true,
  "fechaCompletado": "2025-05-08T09:30:00.000Z"
}
```

### 4. Actualizar Datos de Mantenimiento

**Endpoint:** `PUT /api/toilet-maintenance/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza la información de un mantenimiento existente.

**Request Body:**

```json
{
  "costo": 9200.0,
  "descripcion": "Reparación de válvula de descarga y sistema de ventilación"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "mantenimiento_id": 106,
  "fecha_mantenimiento": "2025-05-07T16:20:00.000Z",
  "tipo_mantenimiento": "Correctivo",
  "descripcion": "Reparación de válvula de descarga y sistema de ventilación",
  "tecnico_responsable": "Juan Pérez",
  "costo": 9200.0,
  "completado": true,
  "fechaCompletado": "2025-05-08T09:30:00.000Z"
}
```

## 5. Ejemplos de Uso

### Registrar un nuevo baño y su primer mantenimiento

```http
# 1. Crear el baño químico
POST /api/chemical_toilets
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "codigo_interno": "BQ-2025-002",
  "modelo": "Premium Plus",
  "fecha_adquisicion": "2025-05-01",
  "estado": "Activo"
}

# 2. Registrar mantenimiento inicial
POST /api/toilet-maintenance
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "toilet_id": 43,
  "tipo_mantenimiento": "Preventivo",
  "descripcion": "Verificación inicial y preparación para uso",
  "tecnico_responsable": "María López",
  "costo": 3000.00
}
```

### Seguimiento de mantenimientos pendientes

```http
# 1. Obtener baños en mantenimiento usando filtros
GET /api/chemical_toilets/search?estado=En%20Mantenimiento
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Obtener mantenimientos pendientes para un baño
GET /api/toilet-maintenance/toilet/42?completado=false
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Marcar un mantenimiento como completado
PATCH /api/toilet-maintenance/106/complete
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 4. Actualizar el estado del baño
PUT /api/chemical_toilets/42
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "estado": "Activo"
}
```

### Obtener estadísticas de mantenimiento y baños por cliente

```http
# 1. Consultar estadísticas de un baño
GET /api/chemical_toilets/stats/42
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 2. Obtener baños asignados a un cliente específico
GET /api/chemical_toilets/by-client/5
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 6. Manejo de Errores

### Baño no encontrado

**Respuesta de Error (404 Not Found):**

```json
{
  "message": "Baño químico con ID 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Mantenimiento no encontrado

**Respuesta de Error (404 Not Found):**

```json
{
  "message": "Mantenimiento con ID 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Error de validación

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": [
    "codigo_interno no debe estar vacío",
    "modelo no debe estar vacío",
    "fecha_adquisicion debe ser una fecha válida"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Acceso denegado

**Respuesta de Error (403 Forbidden):**

```json
{
  "message": "No tiene permisos para realizar esta acción",
  "error": "Forbidden",
  "statusCode": 403
}
```
