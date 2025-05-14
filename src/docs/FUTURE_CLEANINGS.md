# Documentación de la API de Limpiezas Futuras (MVA Backend)

## Índice

1. Introducción
2. Endpoints de Limpiezas Futuras
   - 1. Obtener Todas las Limpiezas Futuras
   - 2. Obtener una Limpieza Futura por ID
   - 3. Crear una Limpieza Futura
   - 4. Modificar una Limpieza Futura
   - 5. Eliminar una Limpieza Futura
3. Estructura de Datos
4. Validaciones
5. Manejo de Errores
6. Integración con Otros Módulos
7. Ejemplos de Uso

## Introducción

El módulo de Limpiezas Futuras (Future Cleanings) permite programar y gestionar las limpiezas futuras de baños químicos para clientes específicos. Esta funcionalidad es esencial para la planificación de mantenimientos preventivos y asegura que los servicios se presten de manera regular según lo acordado con los clientes.

## Endpoints de Limpiezas Futuras

### 1. Obtener Todas las Limpiezas Futuras

**Endpoint:** `GET /api/future_cleanings`  
**Roles permitidos:** Todos los usuarios autenticados

**Descripción:** Retorna una lista de todas las limpiezas futuras programadas en el sistema, incluyendo información del cliente y servicio asociado.

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 1,
    "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
    "isActive": true,
    "numero_de_limpieza": 1,
    "cliente": {
      "clienteId": 5,
      "nombre": "Empresa Constructora ABC",
      "direccion": "Av. Principal 123",
      "telefono": "555-1234",
      "email": "contacto@constructoraabc.com"
    },
    "servicio": {
      "id": 8,
      "tipo_servicio": "MANTENIMIENTO",
      "fecha_instalacion": "2025-04-20T08:00:00.000Z"
    }
  },
  {
    "id": 2,
    "fecha_de_limpieza": "2025-05-16T14:30:00.000Z",
    "isActive": true,
    "numero_de_limpieza": 2,
    "cliente": {
      "clienteId": 7,
      "nombre": "Evento Municipal",
      "direccion": "Plaza Central",
      "telefono": "555-7890",
      "email": "eventos@municipalidad.gob"
    },
    "servicio": {
      "id": 12,
      "tipo_servicio": "MANTENIMIENTO",
      "fecha_instalacion": "2025-05-10T10:00:00.000Z"
    }
  }
]
```

### 2. Obtener una Limpieza Futura por ID

**Endpoint:** `GET /api/future_cleanings/{id}`  
**Roles permitidos:** Todos los usuarios autenticados

**Parámetros de Ruta:**

- `id`: ID numérico de la limpieza futura

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 1,
  "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
  "isActive": true,
  "numero_de_limpieza": 1,
  "cliente": {
    "clienteId": 5,
    "nombre": "Empresa Constructora ABC",
    "direccion": "Av. Principal 123",
    "telefono": "555-1234",
    "email": "contacto@constructoraabc.com"
  },
  "servicio": {
    "id": 8,
    "tipo_servicio": "MANTENIMIENTO",
    "fecha_instalacion": "2025-04-20T08:00:00.000Z"
  }
}
```

### 3. Crear una Limpieza Futura

**Endpoint:** `POST /api/future_cleanings`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Request Body:**

```json
{
  "clientId": 5,
  "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
  "isActive": true,
  "servicioId": 8
}
```

**Campos del Request:**

| Campo             | Tipo    | Requerido | Descripción                               |
| ----------------- | ------- | --------- | ----------------------------------------- |
| clientId          | number  | Sí        | ID del cliente asociado a la limpieza     |
| fecha_de_limpieza | Date    | Sí        | Fecha y hora programada para la limpieza  |
| isActive          | boolean | No        | Estado de la limpieza (por defecto: true) |
| servicioId        | number  | Sí        | ID del servicio asociado a la limpieza    |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 1,
  "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
  "isActive": true,
  "numero_de_limpieza": 1,
  "cliente": {
    "clienteId": 5,
    "nombre": "Empresa Constructora ABC"
  },
  "servicio": {
    "id": 8,
    "tipo_servicio": "MANTENIMIENTO"
  }
}
```

### 4. Modificar una Limpieza Futura

**Endpoint:** `PUT /api/future_cleanings/modify/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR

**Parámetros de Ruta:**

- `id`: ID numérico de la limpieza futura a modificar

**Request Body:**

```json
{
  "isActive": false
}
```

**Campos del Request:**

| Campo    | Tipo    | Requerido | Descripción                              |
| -------- | ------- | --------- | ---------------------------------------- |
| isActive | boolean | Sí        | Nuevo estado de la limpieza (true/false) |

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Future cleaning updated successfully"
}
```

### 5. Eliminar una Limpieza Futura

**Endpoint:** `DELETE /api/future_cleanings/delete/{id}`  
**Roles permitidos:** ADMIN

**Parámetros de Ruta:**

- `id`: ID numérico de la limpieza futura a eliminar

**Respuesta Exitosa (204 No Content):**

```json
{
  "message": "Future cleaning deleted successfully"
}
```

## Estructura de Datos

### Entidad: FuturasLimpiezas

| Campo              | Tipo    | Descripción                               |
| ------------------ | ------- | ----------------------------------------- |
| id                 | number  | Identificador único (PK)                  |
| cliente            | Cliente | Referencia al cliente (FK)                |
| fecha_de_limpieza  | Date    | Fecha y hora programada para la limpieza  |
| isActive           | boolean | Estado de la limpieza (activa o inactiva) |
| numero_de_limpieza | number  | Número secuencial de la limpieza          |
| servicio           | Service | Referencia al servicio asociado (FK)      |

## Validaciones

El módulo implementa las siguientes validaciones:

1. **Existencia del cliente**: Verifica que el cliente exista en la base de datos antes de crear una limpieza futura.
2. **Existencia del servicio**: Verifica que el servicio exista en la base de datos antes de crear una limpieza futura.
3. **Existencia de la limpieza futura**: Verifica que la limpieza futura exista antes de modificarla o eliminarla.

## Manejo de Errores

### Limpieza Futura no encontrada

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Future cleaning not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Cliente no encontrado

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Client not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Servicio no encontrado

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Service not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Sin limpiezas futuras

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "No future cleanings found",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Integración con Otros Módulos

El módulo de Limpiezas Futuras se integra estrechamente con:

1. **Módulo de Clientes**: Utiliza la entidad Cliente para asociar las limpiezas a clientes específicos.
2. **Módulo de Servicios**: Utiliza la entidad Service para asociar las limpiezas a servicios específicos.

Esta integración permite:

- Programar limpiezas para clientes que han contratado servicios de baños químicos
- Dar seguimiento a las limpiezas programadas para cada servicio
- Visualizar el historial de limpiezas futuras asociadas a un cliente o servicio específico

## Ejemplos de Uso

### 1. Crear una nueva limpieza futura

```
POST /api/future_cleanings
Content-Type: application/json
Authorization: Bearer {tu_token_jwt}

{
  "clientId": 5,
  "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
  "isActive": true,
  "servicioId": 8
}
```

### 2. Marcar una limpieza como inactiva

```
PUT /api/future_cleanings/modify/1
Content-Type: application/json
Authorization: Bearer {tu_token_jwt}

{
  "isActive": false
}
```

### 3. Consultar todas las limpiezas futuras activas

```
GET /api/future_cleanings?isActive=true
Authorization: Bearer {tu_token_jwt}
```

### 4. Eliminar una limpieza futura

```
DELETE /api/future_cleanings/delete/1
Authorization: Bearer {tu_token_jwt}
```

### 5. Programación de múltiples limpiezas para un servicio recurrente

Para un cliente con un contrato de mantenimiento semanal, se pueden programar múltiples limpiezas futuras con fechas escalonadas:

```
POST /api/future_cleanings
Content-Type: application/json
Authorization: Bearer {tu_token_jwt}

{
  "clientId": 5,
  "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
  "isActive": true,
  "servicioId": 8
}
```

Repetir este proceso para cada fecha de limpieza (22/05/2025, 29/05/2025, etc.)
