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
   - Tipos de Servicio y Recursos Requeridos
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

#### C. Crear Servicio de LIMPIEZA, REEMPLAZO o RETIRO de Baños Instalados

Para servicios que operan sobre baños ya instalados en el cliente:

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-16T10:00:00.000Z",
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Santa Fe 5678, Buenos Aires",
  "asignacionAutomatica": true,
  "banosInstalados": [5, 6, 7]
}
```

| Campo                | Tipo               | Requerido | Descripción                                                                         |
| -------------------- | ------------------ | --------- | ----------------------------------------------------------------------------------- |
| clienteId            | number             | Sí        | ID del cliente                                                                      |
| fechaProgramada      | string (fecha ISO) | Sí        | Fecha programada del servicio                                                       |
| tipoServicio         | string             | Sí        | INSTALACION, RETIRO, LIMPIEZA, MANTENIMIENTO, etc.                                  |
| cantidadBanos        | number             | Sí        | Cantidad de baños requeridos (0 para servicios de tipo LIMPIEZA, REEMPLAZO, RETIRO) |
| cantidadEmpleados    | number             | Sí        | Cantidad de empleados requeridos                                                    |
| cantidadVehiculos    | number             | Sí        | Cantidad de vehículos requeridos                                                    |
| ubicacion            | string             | Sí        | Ubicación del servicio                                                              |
| notas                | string             | No        | Notas adicionales                                                                   |
| asignacionAutomatica | boolean            | Sí        | Si es true, el sistema asigna recursos; si es false, asignación manual              |
| asignacionesManual   | array              | No\*      | Array de asignaciones manuales (\*Requerido si asignacionAutomatica es false)       |
| banosInstalados      | array of number    | No\*      | IDs de los baños ya instalados (\*Requerido para LIMPIEZA, REEMPLAZO, RETIRO)       |

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

#### C. Actualizar Asignaciones Manualmente

```json
{
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 3,
      "vehiculoId": 2,
      "banosIds": [4, 5]
    },
    {
      "empleadoId": 4,
      "vehiculoId": 3
    }
  ]
}
```

#### D. Actualizar Lista de Baños Instalados (para servicios de LIMPIEZA, REEMPLAZO, RETIRO)

```json
{
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,
  "banosInstalados": [8, 9, 10]
}
```

#### Respuesta Exitosa (200 OK)

```json
{
  "id": 1,
  "clienteId": 1,
  /* resto de datos del servicio actualizado */
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

**Estados Válidos:** `PROGRAMADO`, `EN_PROGRESO`, `COMPLETADO`, `CANCELADO`, `SUSPENDIDO`

#### Respuesta Exitosa (200 OK)

```json
{
  "id": 1,
  "clienteId": 1,
  /* resto de datos del servicio */
  "estado": "EN_PROGRESO",
  "fechaInicio": "2025-05-15T10:30:00.000Z",
  /* resto de datos */
  "asignaciones": [
    // Detalles de las asignaciones
  ]
}
```

### 6. Eliminar un Servicio

**Endpoint:** `DELETE /api/services/{id}`

**Nota:** Solo se pueden eliminar servicios en estado `PROGRAMADO`.

#### Respuesta Exitosa (204 No Content)

No devuelve contenido.

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

El sistema permite asignar empleados y vehículos que ya están en estado `ASIGNADO` a otros servicios programados para la misma fecha. Esta funcionalidad facilita la planificación de múltiples servicios en un mismo día utilizando los mismos recursos.

1. El primer servicio cambia el estado de los recursos de `DISPONIBLE` a `ASIGNADO`
2. Los servicios adicionales pueden usar esos mismos recursos sin cambiar su estado
3. El estado `ASIGNADO` se mantiene hasta que se liberen todos los servicios asociados
4. Los recursos vuelven al estado `DISPONIBLE` cuando se liberan todos los servicios a los que estaban asignados

**Consideraciones:**

- El sistema no tiene en cuenta las horas de los servicios, solo las fechas
- Los mantenimientos programados siempre tienen prioridad: un recurso no puede ser asignado en una fecha donde tiene mantenimiento programado, incluso si está en estado "ASIGNADO"
- En la asignación automática, el sistema intenta distribuir equitativamente la carga de trabajo

### Tipos de Servicio y Recursos Requeridos

Los distintos tipos de servicio tienen requisitos diferentes en cuanto a los recursos que necesitan:

| Tipo Servicio         | Requiere Baños Nuevos | Requiere Baños Instalados | Campo cantidadBanos | Campo banosInstalados |
| --------------------- | :-------------------: | :-----------------------: | :-----------------: | :-------------------: |
| INSTALACION           |          Sí           |            No             |         > 0         |     No requerido      |
| LIMPIEZA              |          No           |            Sí             |          0          |       Requerido       |
| REEMPLAZO             |          No           |            Sí             |          0          |       Requerido       |
| RETIRO                |          No           |            Sí             |          0          |       Requerido       |
| MANTENIMIENTO_IN_SITU |          No           |            Sí             |          0          |       Requerido       |
| REPARACION            |          No           |            Sí             |          0          |       Requerido       |
| TRASLADO              |          Sí           |            No             |         > 0         |     No requerido      |
| REUBICACION           |          Sí           |            No             |         > 0         |     No requerido      |
| MANTENIMIENTO         |          Sí           |            No             |         > 0         |     No requerido      |

**Nota:** Para los servicios que requieren baños ya instalados, el sistema verificará que los baños especificados existan y estén en estado ASIGNADO.

## Estados de Servicio

| Estado      | Descripción                                          | Transiciones Permitidas |
| ----------- | ---------------------------------------------------- | ----------------------- |
| PROGRAMADO  | Servicio con recursos asignados, listo para ejecutar | EN_PROGRESO, CANCELADO  |
| EN_PROGRESO | Servicio que se está ejecutando actualmente          | COMPLETADO, CANCELADO   |
| COMPLETADO  | Servicio finalizado correctamente                    | Ninguna                 |
| CANCELADO   | Servicio cancelado                                   | Ninguna                 |
| SUSPENDIDO  | Servicio temporalmente suspendido                    | EN_PROGRESO, CANCELADO  |

## Manejo de Errores

La API devuelve códigos de error HTTP estándar junto con mensajes descriptivos:

- `400 Bad Request`: Parámetros inválidos
- `401 Unauthorized`: Token de autenticación faltante o inválido
- `403 Forbidden`: Permisos insuficientes para la operación
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto de recursos (por ejemplo, no hay suficientes recursos disponibles)
- `500 Internal Server Error`: Error del servidor

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

### 4. Gestión de Servicios con Baños Ya Instalados

1. **Crear un servicio de LIMPIEZA para baños ya instalados**

   ```
   POST /api/services
   {
     "clienteId": 3,
     "fechaProgramada": "2025-06-15T09:00:00.000Z",
     "tipoServicio": "LIMPIEZA",
     "cantidadBanos": 0,
     "cantidadEmpleados": 2,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. Belgrano 2500",
     "asignacionAutomatica": true,
     "banosInstalados": [5, 6, 7]
   }
   ```

2. **Crear un servicio de RETIRO al finalizar un contrato**

   ```
   POST /api/services
   {
     "clienteId": 3,
     "fechaProgramada": "2025-07-01T10:00:00.000Z",
     "tipoServicio": "RETIRO",
     "cantidadBanos": 0,
     "cantidadEmpleados": 2,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. Belgrano 2500",
     "asignacionAutomatica": true,
     "banosInstalados": [5, 6, 7]
   }
   ```

3. **Completar el servicio de RETIRO y verificar que los baños cambian a EN_MANTENIMIENTO**

   ```
   PATCH /api/services/{servicioRetiroId}/estado
   {
     "estado": "COMPLETADO"
   }
   ```

   ```
   GET /api/chemical_toilets/5
   GET /api/chemical_toilets/6
   GET /api/chemical_toilets/7
   ```

### Recomendaciones Adicionales

- Siempre verifica el estado de los recursos después de operaciones de asignación
- Utiliza la asignación automática para casos simples y la manual para casos específicos
- Comprueba el estado del servicio antes de intentar actualizarlo
- Para servicios con múltiples asignaciones, asegúrate de que la suma de los recursos asignados manualmente coincida con las cantidades requeridas
- Cuando planifiques múltiples servicios con los mismos recursos, ten en cuenta que el sistema sólo verifica disponibilidad por fecha (no por hora)
- Para servicios de tipo LIMPIEZA, REEMPLAZO o RETIRO, recuerda establecer cantidadBanos en 0 y proporcionar los IDs de los baños ya instalados en el campo banosInstalados

```

```
