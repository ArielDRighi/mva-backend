# Documentación de la API de Servicios (MVA Backend)

## Índice

1. Introducción
2. Autenticación
3. Endpoints de Servicios
   - 1. Crear un Servicio
   - 2. Obtener Servicios
   - 3. Obtener un Servicio Específico
   - 4. Actualizar un Servicio
   - 5. Cambiar Estado de un Servicio
   - 6. Eliminar un Servicio
4. Gestión de Recursos
   - Asignación Automática
   - Asignación Manual
5. Estados de Servicio
6. Manejo de Errores
7. Ejemplos de Flujos Completos

## Introducción

La API de Servicios permite gestionar los servicios de mantenimiento, instalación y retiro de baños químicos, incluyendo la asignación de recursos (empleados, vehículos y baños) de forma automática o manual. Este documento detalla todas las operaciones disponibles y cómo utilizarlas correctamente.

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

## Endpoints de Servicios

### 1. Crear un Servicio

**Endpoint:** `POST /api/services`

#### A. Crear Servicio con Asignación Automática

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-15T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true
}
```

#### B. Crear Servicio con Asignación Manual

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-16T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 2,
  "ubicacion": "Av. Santa Fe 5678, Buenos Aires",
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 1,
      "vehiculoId": 1,
      "banosIds": [1]
    },
    {
      "empleadoId": 2,
      "vehiculoId": 2,
      "banosIds": [2]
    }
  ]
}
```

#### Respuesta Exitosa (201 Created)

```json
{
  "id": 1,
  "clienteId": 1,
  "cliente": {
    "clienteId": 1,
    "nombre": "Constructora ABC",
    "email": "contacto@constructoraabc.com",
    "cuit": "30-71234567-0",
    "direccion": "Av. Principal 123, Buenos Aires",
    "telefono": "011-4567-8901",
    "contacto_principal": "Juan Pérez",
    "estado": "ACTIVO"
  },
  "fechaProgramada": "2025-05-15T10:00:00.000Z",
  "fechaInicio": null,
  "fechaFin": null,
  "tipoServicio": "INSTALACION",
  "estado": "PROGRAMADO",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true,
  "fechaCreacion": "2025-04-10T15:30:00.000Z",
  "asignaciones": [
    // Detalles de las asignaciones
  ]
}
```

### 2. Obtener Servicios

**Endpoint:** `GET /api/services`

#### Parámetros de Consulta Opcionales

| Parámetro    | Tipo   | Descripción                                                                                          |
| ------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| clienteId    | number | Filtrar por ID de cliente                                                                            |
| estado       | string | Filtrar por estado (`PROGRAMADO`, `EN_PROGRESO`, `COMPLETADO`, `CANCELADO`, `PENDIENTE_RECURSOS`)    |
| tipoServicio | string | Filtrar por tipo (`INSTALACION`, `RETIRO`, `LIMPIEZA`, `MANTENIMIENTO`, `REPARACION`, `REUBICACION`) |
| ubicacion    | string | Filtrar por ubicación (búsqueda parcial)                                                             |
| fechaDesde   | string | Fecha inicial (formato ISO)                                                                          |
| fechaHasta   | string | Fecha final (formato ISO)                                                                            |

#### Ejemplos

```
GET /api/services
GET /api/services?estado=PROGRAMADO
GET /api/services?clienteId=1&estado=PROGRAMADO
GET /api/services?fechaDesde=2025-05-01T00:00:00.000Z&fechaHasta=2025-06-01T00:00:00.000Z
```

#### Respuesta Exitosa (200 OK)

```json
[
  {
    "id": 1,
    "clienteId": 1,
    "cliente": {
      /* datos del cliente */
    },
    "fechaProgramada": "2025-05-15T10:00:00.000Z",
    "fechaInicio": null,
    "fechaFin": null,
    "tipoServicio": "INSTALACION",
    "estado": "PROGRAMADO",
    "cantidadBanos": 2,
    "cantidadEmpleados": 2,
    "cantidadVehiculos": 1,
    "ubicacion": "Av. Corrientes 1234, Buenos Aires",
    "notas": "Entregar antes de las 9am",
    "asignacionAutomatica": true,
    "fechaCreacion": "2025-04-10T15:30:00.000Z",
    "asignaciones": [
      // Detalles de las asignaciones
    ]
  }
  // Más servicios...
]
```

### 3. Obtener un Servicio Específico

**Endpoint:** `GET /api/services/{id}`

```
GET /api/services/1
```

#### Respuesta Exitosa (200 OK)

```json
{
  "id": 1,
  "clienteId": 1,
  "cliente": {
    /* datos del cliente */
  },
  "fechaProgramada": "2025-05-15T10:00:00.000Z",
  "fechaInicio": null,
  "fechaFin": null,
  "tipoServicio": "INSTALACION",
  "estado": "PROGRAMADO",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true,
  "fechaCreacion": "2025-04-10T15:30:00.000Z",
  "asignaciones": [
    {
      "id": 1,
      "servicioId": 1,
      "empleadoId": 1,
      "empleado": {
        /* datos del empleado */
      },
      "vehiculoId": 1,
      "vehiculo": {
        /* datos del vehículo */
      },
      "banoId": 1,
      "bano": {
        /* datos del baño */
      },
      "fechaAsignacion": "2025-04-10T15:30:00.000Z"
    }
    // Más asignaciones...
  ]
}
```

### 4. Actualizar un Servicio

**Endpoint:** `PUT /api/services/{id}`

#### A. Actualizar Información Básica

```json
{
  "notas": "Nota actualizada - llevar herramientas adicionales",
  "ubicacion": "Av. Corrientes 1234, Piso 3, Buenos Aires"
}
```

#### B. Actualizar Cantidades y Reasignar Recursos Automáticamente

```json
{
  "cantidadBanos": 3,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "asignacionAutomatica": true
}
```

#### C. Cambiar a Asignación Manual

```json
{
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 3,
      "vehiculoId": 3,
      "banosIds": [3, 4, 5]
    }
  ]
}
```

#### Respuesta Exitosa (200 OK)

```json
{
  "id": 1,
  "clienteId": 1,
  "cliente": {
    /* datos del cliente */
  },
  "fechaProgramada": "2025-05-15T10:00:00.000Z",
  "fechaInicio": null,
  "fechaFin": null,
  "tipoServicio": "INSTALACION",
  "estado": "PROGRAMADO",
  "cantidadBanos": 3,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "ubicacion": "Av. Corrientes 1234, Piso 3, Buenos Aires",
  "notas": "Nota actualizada - llevar herramientas adicionales",
  "asignacionAutomatica": true,
  "fechaCreacion": "2025-04-10T15:30:00.000Z",
  "asignaciones": [
    // Asignaciones actualizadas
  ]
}
```

### 5. Cambiar Estado de un Servicio

**Endpoint:** `PATCH /api/services/{id}/estado`

```json
{
  "estado": "EN_PROGRESO"
}
```

Estados válidos:

- PENDIENTE_RECURSOS
- PROGRAMADO
- EN_PROGRESO
- COMPLETADO
- CANCELADO

#### Respuesta Exitosa (200 OK)

```json
{
  "id": 1,
  "estado": "EN_PROGRESO",
  "fechaInicio": "2025-04-10T16:45:00.000Z", // Se establece la fecha de inicio al cambiar a EN_PROGRESO
  "fechaFin": null
  // Resto de los datos del servicio...
}
```

**Notas:**

- Al cambiar a `EN_PROGRESO`, se establece automáticamente `fechaInicio`
- Al cambiar a `COMPLETADO`, se establece automáticamente `fechaFin` y se liberan todos los recursos
- Al cambiar a `CANCELADO`, se liberan todos los recursos

### 6. Eliminar un Servicio

**Endpoint:** `DELETE /api/services/{id}`

```
DELETE /api/services/1
```

#### Respuesta Exitosa (204 No Content)

## Gestión de Recursos

### Asignación Automática

Cuando `asignacionAutomatica` es `true`, el sistema:

1. Busca recursos disponibles (empleados, vehículos y baños)
2. Verifica que no estén asignados a otros servicios en la misma fecha
3. Verifica que no tengan mantenimientos programados para esa fecha
4. Los asigna automáticamente según las cantidades especificadas
5. Cambia el estado de los recursos a `ASIGNADO`

### Asignación Manual

Cuando `asignacionAutomatica` es `false` y se proporciona `asignacionesManual`, el sistema:

1. Verifica que cada recurso especificado esté disponible
2. Crea asignaciones según la estructura proporcionada
3. Cambia el estado de los recursos a `ASIGNADO`

#### Estructura de Asignación Manual

```json
{
  "empleadoId": 1, // Opcional
  "vehiculoId": 1, // Opcional
  "banosIds": [1, 2] // Opcional, array de IDs de baños
}
```

## Estados de Servicio

| Estado             | Descripción                                          | Transiciones Permitidas |
| ------------------ | ---------------------------------------------------- | ----------------------- |
| PENDIENTE_RECURSOS | Servicio creado sin recursos suficientes             | PROGRAMADO, CANCELADO   |
| PROGRAMADO         | Servicio con recursos asignados, listo para ejecutar | EN_PROGRESO, CANCELADO  |
| EN_PROGRESO        | Servicio que se está ejecutando actualmente          | COMPLETADO, CANCELADO   |
| COMPLETADO         | Servicio finalizado correctamente                    | Ninguna                 |
| CANCELADO          | Servicio cancelado                                   | Ninguna                 |

## Manejo de Errores

### Respuesta de Error (400 Bad Request)

```json
{
  "message": "No hay suficientes baños químicos disponibles. Se requieren 5, pero solo hay 2 disponibles.",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Respuesta de Error (404 Not Found)

```json
{
  "message": "Servicio con ID 999 no encontrado",
  "error": "Not Found",
  "statusCode": 404
}
```

### Validaciones Comunes

- Los recursos deben estar en estado `DISPONIBLE` para ser asignados
- No se pueden asignar recursos que tienen mantenimientos programados para la fecha del servicio
- No se pueden asignar recursos que ya están asignados a otro servicio en la misma fecha
- Transiciones de estado deben seguir el flujo permitido

## Ejemplos de Flujos Completos

### 1. Flujo Básico de un Servicio

1. **Crear servicio con asignación automática**

   ```
   POST /api/services
   ```

2. **Verificar que los recursos fueron asignados**

   ```
   GET /api/services/{id}
   ```

3. **Actualizar a estado EN_PROGRESO cuando el servicio inicia**

   ```
   PATCH /api/services/{id}/estado
   { "estado": "EN_PROGRESO" }
   ```

4. **Actualizar a estado COMPLETADO cuando el servicio finaliza**
   ```
   PATCH /api/services/{id}/estado
   { "estado": "COMPLETADO" }
   ```

### 2. Modificación de Recursos Durante el Servicio

1. **Crear servicio inicial con 1 empleado, 1 vehículo, 1 baño**

   ```
   POST /api/services
   ```

2. **Aumentar la cantidad de recursos**

   ```
   PUT /api/services/{id}
   {
     "cantidadBanos": 2,
     "cantidadEmpleados": 2,
     "cantidadVehiculos": 1,
     "asignacionAutomatica": true
   }
   ```

3. **Verificar que se hayan asignado recursos adicionales**

   ```
   GET /api/services/{id}
   ```

4. **Reducir la cantidad de recursos**

   ```
   PUT /api/services/{id}
   {
     "cantidadBanos": 1,
     "cantidadEmpleados": 1,
     "cantidadVehiculos": 1,
     "asignacionAutomatica": true
   }
   ```

5. **Verificar que se hayan liberado los recursos sobrantes**
   ```
   GET /api/services/{id}
   ```

### 3. Cambio de Asignación Automática a Manual

1. **Crear servicio con asignación automática**

   ```
   POST /api/services
   ```

2. **Cambiar a asignación manual con recursos específicos**

   ```
   PUT /api/services/{id}
   {
     "asignacionAutomatica": false,
     "asignacionesManual": [
       {
         "empleadoId": 3,
         "vehiculoId": 3,
         "banosIds": [3]
       }
     ]
   }
   ```

3. **Verificar que los recursos anteriores se liberaron y los nuevos se asignaron**
   ```
   GET /api/services/{id}
   ```

### Recomendaciones Adicionales

- Siempre verifica el estado de los recursos después de operaciones de asignación
- Utiliza la asignación automática para casos simples y la manual para casos específicos
- Comprueba el estado del servicio antes de intentar actualizarlo
- Para servicios con múltiples asignaciones, asegúrate de que la suma de los recursos asignados manualmente coincida con las cantidades requeridas
