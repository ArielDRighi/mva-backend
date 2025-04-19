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
   - Asignación Múltiple de Recursos
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

| Campo                | Tipo               | Requerido | Descripción                                                                   |
| -------------------- | ------------------ | --------- | ----------------------------------------------------------------------------- |
| clienteId            | number             | Sí        | ID del cliente                                                                |
| fechaProgramada      | string (fecha ISO) | Sí        | Fecha programada del servicio                                                 |
| tipoServicio         | string             | Sí        | INSTALACION, RETIRO, LIMPIEZA, MANTENIMIENTO, etc.                            |
| cantidadBanos        | number             | Sí        | Cantidad de baños requeridos                                                  |
| cantidadEmpleados    | number             | Sí        | Cantidad de empleados requeridos                                              |
| cantidadVehiculos    | number             | Sí        | Cantidad de vehículos requeridos                                              |
| ubicacion            | string             | Sí        | Ubicación del servicio                                                        |
| notas                | string             | No        | Notas adicionales                                                             |
| asignacionAutomatica | boolean            | Sí        | Si es true, el sistema asigna recursos; si es false, asignación manual        |
| asignacionesManual   | array              | No\*      | Array de asignaciones manuales (\*Requerido si asignacionAutomatica es false) |

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

**Parámetros de Query:**

| Parámetro    | Tipo               | Descripción                     |
| ------------ | ------------------ | ------------------------------- |
| estado       | string             | Filtrar por estado del servicio |
| clienteId    | number             | Filtrar por cliente             |
| fechaDesde   | string (fecha ISO) | Filtrar desde esta fecha        |
| fechaHasta   | string (fecha ISO) | Filtrar hasta esta fecha        |
| tipoServicio | string             | Filtrar por tipo de servicio    |

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

#### Respuesta Exitosa (204 No Content)

No hay cuerpo de respuesta para una eliminación exitosa.

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

### Asignación Múltiple de Recursos

La API ahora permite asignar empleados y vehículos con estado "ASIGNADO" a múltiples servicios para la misma fecha o fechas diferentes:

1. Los empleados y vehículos en estado "ASIGNADO" pueden ser incluidos en nuevos servicios
2. Para asignar un recurso ya asignado:
   - En asignación manual: incluir su ID en `asignacionesManual`
   - En asignación automática: el sistema considera recursos con estado "ASIGNADO" y "DISPONIBLE"
3. Sólo se cambia el estado a "ASIGNADO" cuando un recurso pasa de "DISPONIBLE" a "ASIGNADO"
4. Los baños químicos siguen el comportamiento original: deben estar en estado "DISPONIBLE" para ser asignados
5. Un recurso vuelve al estado "DISPONIBLE" cuando se liberan todos los servicios a los que estaba asignado

**Consideraciones:**

- El sistema no tiene en cuenta las horas de los servicios, solo las fechas
- Los mantenimientos programados siempre tienen prioridad: un recurso no puede ser asignado en una fecha donde tiene mantenimiento programado, incluso si está en estado "ASIGNADO"
- En la asignación automática, el sistema intenta distribuir equitativamente la carga de trabajo

## Estados de Servicio

| Estado      | Descripción                                          | Transiciones Permitidas |
| ----------- | ---------------------------------------------------- | ----------------------- |
| PROGRAMADO  | Servicio con recursos asignados, listo para ejecutar | EN_PROGRESO, CANCELADO  |
| EN_PROGRESO | Servicio que se está ejecutando actualmente          | COMPLETADO, CANCELADO   |
| COMPLETADO  | Servicio finalizado correctamente                    | Ninguna                 |
| CANCELADO   | Servicio cancelado                                   | Ninguna                 |
| SUSPENDIDO  | Servicio temporalmente suspendido                    | EN_PROGRESO, CANCELADO  |

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

- Los empleados y vehículos deben estar en estado `DISPONIBLE` o `ASIGNADO` para ser asignados a servicios
- Los baños químicos deben estar en estado `DISPONIBLE` para ser asignados
- No se pueden asignar recursos que tienen mantenimientos programados para la fecha del servicio
- Transiciones de estado deben seguir el flujo permitido

## Ejemplos de Flujos Completos

### 1. Flujo Básico de un Servicio

1. **Crear un servicio con asignación automática**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-05-20T10:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 2,
     "cantidadEmpleados": 2,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. 9 de Julio 1000",
     "asignacionAutomatica": true
   }
   ```

2. **Verificar las asignaciones realizadas**

   ```
   GET /api/services/{id}
   ```

3. **Iniciar el servicio el día de la ejecución**

   ```
   PATCH /api/services/{id}/estado
   {
     "estado": "EN_PROGRESO"
   }
   ```

4. **Completar el servicio**

   ```
   PATCH /api/services/{id}/estado
   {
     "estado": "COMPLETADO"
   }
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

### 3. Asignación de Recursos Múltiples a Varios Servicios

1. **Crear un primer servicio**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-06-10T08:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 2,
     "cantidadEmpleados": 1,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. Libertador 1500",
     "asignacionAutomatica": true
   }
   ```

2. **Verificar los recursos asignados**

   ```
   GET /api/services/{servicio1Id}
   ```

3. **Crear un segundo servicio para la misma fecha usando los mismos recursos**

   ```
   POST /api/services
   {
     "clienteId": 2,
     "fechaProgramada": "2025-06-10T14:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 1,
     "cantidadEmpleados": 1,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. Callao 500",
     "asignacionAutomatica": false,
     "asignacionesManual": [
       {
         "empleadoId": 1,
         "vehiculoId": 1,
         "banosIds": [3]
       }
     ]
   }
   ```

4. **Verificar que los recursos están asignados a ambos servicios**

   ```
   GET /api/services/{servicio1Id}
   GET /api/services/{servicio2Id}
   ```

5. **Completar uno de los servicios**

   ```
   PATCH /api/services/{servicio1Id}/estado
   {
     "estado": "COMPLETADO"
   }
   ```

6. **Verificar que los recursos siguen en estado "ASIGNADO"**

   ```
   GET /api/employees/1
   GET /api/vehicles/1
   ```

7. **Completar el segundo servicio**

   ```
   PATCH /api/services/{servicio2Id}/estado
   {
     "estado": "COMPLETADO"
   }
   ```

8. **Verificar que los recursos ahora están en estado "DISPONIBLE"**
   ```
   GET /api/employees/1
   GET /api/vehicles/1
   ```

### Recomendaciones Adicionales

- Siempre verifica el estado de los recursos después de operaciones de asignación
- Utiliza la asignación automática para casos simples y la manual para casos específicos
- Comprueba el estado del servicio antes de intentar actualizarlo
- Para servicios con múltiples asignaciones, asegúrate de que la suma de los recursos asignados manualmente coincida con las cantidades requeridas
- Cuando planifiques múltiples servicios con los mismos recursos, ten en cuenta que el sistema sólo verifica disponibilidad por fecha (no por hora)

```

El documento ha sido actualizado con toda la información sobre la nueva funcionalidad de asignación múltiple de recursos, incluyendo una nueva sección dedicada a esta característica y un nuevo ejemplo de flujo completo que muestra cómo asignar los mismos recursos a múltiples servicios.El documento ha sido actualizado con toda la información sobre la nueva funcionalidad de asignación múltiple de recursos, incluyendo una nueva sección dedicada a esta característica y un nuevo ejemplo de flujo completo que muestra cómo asignar los mismos recursos a múltiples servicios.
```
