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
   - Gestión de Baños Asignados
   - Servicio de Capacitación
5. Estados de Servicio
6. Estados de Recursos
7. Integración con Condiciones Contractuales
8. Estructura de Respuesta JSON
9. Manejo de Errores
10. Ejemplos de Flujos Completos

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

#### A. Crear Servicio de INSTALACIÓN utilizando datos de la condición contractual

En este caso, el servicio toma automáticamente el tipo de servicio y cantidad de baños desde la condición contractual asociada:

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-05T10:00:00.000Z",
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true,
  "condicionContractualId": 1
}
```

#### B. Crear Servicio especificando datos explícitamente (aunque use condición contractual)

En este caso, se especifican explícitamente el tipo de servicio y cantidad de baños, aunque se use una condición contractual para otros valores:

```json
{
  "clienteId": 2,
  "fechaProgramada": "2025-06-15T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 3,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Cliente solicitó entrega antes de las 9am",
  "asignacionAutomatica": true,
  "condicionContractualId": 2
}
```

#### C. Crear Servicio con Asignación Manual

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-16T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadVehiculos": 2,
  "ubicacion": "Av. Santa Fe 5678, Buenos Aires",
  "asignacionAutomatica": false,
  "empleadoAId": 1,
  "empleadoBId": 2,
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
  ],
  "condicionContractualId": 1
}
```

#### D. Crear Servicio de LIMPIEZA, REEMPLAZO o RETIRO de Baños Instalados

Para servicios que operan sobre baños ya instalados en el cliente:

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-16T10:00:00.000Z",
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Santa Fe 5678, Buenos Aires",
  "asignacionAutomatica": true,
  "banosInstalados": [5, 6, 7]
}
```

#### E. Crear Servicio de CAPACITACIÓN

Para servicios de capacitación que solo requieren empleados:

```json
{
  "fechaProgramada": "2025-05-20T09:00:00.000Z",
  "tipoServicio": "CAPACITACION",
  "cantidadBanos": 0,
  "cantidadVehiculos": 0,
  "ubicacion": "Sede Central, Av. Rivadavia, Buenos Aires",
  "notas": "Capacitación sobre manejo de equipos nuevos",
  "asignacionAutomatica": false,
  "empleadoAId": 1,
  "empleadoBId": 2,
  "asignacionesManual": [{ "empleadoId": 1 }, { "empleadoId": 2 }]
}
```

| Campo                  | Tipo               | Requerido | Descripción                                                                                       |
| ---------------------- | ------------------ | --------- | ------------------------------------------------------------------------------------------------- |
| clienteId              | number             | No\*      | ID del cliente (\*Opcional para servicios de tipo CAPACITACION, que pueden ser internos)          |
| fechaProgramada        | string (fecha ISO) | Sí        | Fecha programada del servicio                                                                     |
| tipoServicio           | string             | Sí        | INSTALACION, RETIRO, LIMPIEZA, MANTENIMIENTO, CAPACITACION, etc.                                  |
| cantidadBanos          | number             | Sí        | Cantidad de baños requeridos (0 para servicios de tipo LIMPIEZA, REEMPLAZO, RETIRO, CAPACITACION) |
| cantidadVehiculos      | number             | Sí        | Cantidad de vehículos requeridos (0 para servicios de tipo CAPACITACION)                          |
| empleadoAId            | number             | No        | ID específico para el primer empleado (empleado A)                                                |
| empleadoBId            | number             | No        | ID específico para el segundo empleado (empleado B)                                               |
| ubicacion              | string             | Sí        | Ubicación del servicio                                                                            |
| notas                  | string             | No        | Notas adicionales                                                                                 |
| asignacionAutomatica   | boolean            | Sí        | Si es true, el sistema asigna recursos; si es false, asignación manual                            |
| asignacionesManual     | array              | No\*      | Array de asignaciones manuales (\*Requerido si asignacionAutomatica es false)                     |
| banosInstalados        | array of number    | No\*      | IDs de los baños ya instalados (\*Requerido para LIMPIEZA, REEMPLAZO, RETIRO)                     |
| condicionContractualId | number             | No        | ID de la condición contractual asociada (recomendado para servicios de INSTALACIÓN)               |

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
  "fechaFinAsignacion": "2025-12-31T00:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "estado": "PROGRAMADO",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "empleadoAId": 1,
  "empleadoBId": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true,
  "condicionContractualId": 1,
  "fechaCreacion": "2025-04-10T15:30:00.000Z",
  "asignaciones": [
    // Detalles de las asignaciones
  ]
}
```

## 2. Obtener Servicios

**Endpoint: GET /api/services**
**Roles permitidos: Todos los usuarios autenticados**
**Descripción: Recupera los servicios registrados en el sistema. Se permite filtrar por estado, cliente, fechas y tipo de servicio, así como buscar por texto libre y paginar los resultados.**

**Parámetros de Query:**

| Parámetro    | Tipo              | Descripción                                                                 |
| ------------ | ----------------- | --------------------------------------------------------------------------- |
| estado       | string            | Filtra por estado del servicio (ej: `PROGRAMADO`, `EN_CURSO`, `FINALIZADO`) |
| clienteId    | number            | Filtra por ID del cliente asociado                                          |
| tipoServicio | string            | Filtra por tipo de servicio (`INSTALACION`, `RETIRO`, etc.)                 |
| tipoServicio | string            | Filtra por tipo de servicio (`INSTALACION`, `RETIRO`, `CAPACITACION`, etc.) |
| fechaDesde   | string (ISO 8601) | Filtra servicios cuya fecha programada sea igual o posterior a esta fecha   |
| fechaHasta   | string (ISO 8601) | Filtra servicios cuya fecha programada sea igual o anterior a esta fecha    |
| search       | string            | Búsqueda parcial por estado, tipo de servicio o nombre del cliente          |
| page         | number            | Número de página a recuperar (por defecto: 1)                               |
| limit        | number            | Cantidad de resultados por página (por defecto: 10)                         |

#### Ejemplos

```
GET /api/services
GET /api/services?estado=PROGRAMADO
GET /api/services?clienteId=1&estado=FINALIZADO
GET /api/services?tipoServicio=INSTALACION
GET /api/services?tipoServicio=CAPACITACION
GET /api/services?search=instalacion
GET /api/services?fechaDesde=2025-05-01T00:00:00.000Z&fechaHasta=2025-06-01T00:00:00.000Z
GET /api/services?search=constructora&page=2&limit=5
```

#### Respuesta Exitosa (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "clienteId": 1,
      "cliente": {
        // datos del cliente
      },
      "fechaProgramada": "2025-05-15T10:00:00.000Z",
      "fechaInicio": null,
      "fechaFin": null,
      "fechaFinAsignacion": "2025-12-31T00:00:00.000Z",
      "tipoServicio": "INSTALACION",
      "estado": "PROGRAMADO",
      "cantidadBanos": 2,
      "cantidadEmpleados": 2,
      "empleadoAId": 1,
      "empleadoBId": 2,
      "cantidadVehiculos": 1,
      "ubicacion": "Av. Corrientes 1234, Buenos Aires",
      "notas": "Entregar antes de las 9am",
      "asignacionAutomatica": true,
      "condicionContractualId": 1,
      "fechaCreacion": "2025-04-10T15:30:00.000Z",
      "asignaciones": [
        // Detalles de asignaciones (empleados, vehículos, baños)
      ]
    }
    // Más servicios...
  ],
  "totalItems": 15,
  "currentPage": 1,
  "totalPages": 2
}
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
  "fechaFinAsignacion": "2025-12-31T00:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "estado": "PROGRAMADO",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "empleadoAId": 1,
  "empleadoBId": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true,
  "condicionContractualId": 1,
  "fechaCreacion": "2025-04-10T15:30:00.000Z",
  "asignaciones": [
    {
      "id": 1,
      "servicioId": 1,
      "empleadoId": 1,
      "empleado": {
        /* datos del empleado */
      }
    },
    {
      "id": 2,
      "servicioId": 1,
      "empleadoId": 2,
      "empleado": {
        /* datos del empleado */
      }
    },
    {
      "id": 3,
      "servicioId": 1,
      "vehiculoId": 1,
      "vehiculo": {
        /* datos del vehículo */
      }
    },
    {
      "id": 4,
      "servicioId": 1,
      "banoId": 1,
      "bano": {
        /* datos del baño */
      }
    },
    {
      "id": 5,
      "servicioId": 1,
      "banoId": 2,
      "bano": {
        /* datos del baño */
      }
    }
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

#### E. Actualizar Servicio de CAPACITACIÓN

```json
{
  "tipoServicio": "CAPACITACION",
  "cantidadBanos": 0,
  "cantidadVehiculos": 0,
  "asignacionAutomatica": true,
  "notas": "Se amplía la cantidad de empleados para la capacitación"
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

#### Cambiar a estado regular

```json
{
  "estado": "EN_PROGRESO"
}
```

#### Cambiar a estado INCOMPLETO (requiere comentario obligatorio)

```json
{
  "estado": "INCOMPLETO",
  "comentarioIncompleto": "No se pudo completar el servicio debido a falta de acceso al sitio"
}
```

**Estados Válidos:** `PROGRAMADO`, `EN_PROGRESO`, `COMPLETADO`, `CANCELADO`, `SUSPENDIDO`, `INCOMPLETO`

**Notas Importantes:**

- El estado `INCOMPLETO` solo puede aplicarse a servicios que están en estado `EN_PROGRESO`
- Al cambiar a estado `INCOMPLETO` es obligatorio proporcionar un comentario en el campo `comentarioIncompleto`
- Los estados `COMPLETADO`, `CANCELADO` e `INCOMPLETO` son estados finales y no permiten transiciones a otros estados

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

1. Asigna exactamente 2 empleados (empleadoA y empleadoB)
2. Busca recursos disponibles (empleados, vehículos y baños)
3. Verifica que no estén asignados a otros servicios en la misma fecha
4. Verifica que no tengan mantenimientos programados para esa fecha
5. Los asigna automáticamente según las cantidades especificadas
6. Cambia el estado de los recursos según el tipo de servicio:
   - Para servicios de `CAPACITACION`, los empleados pasan a estado `EN_CAPACITACION`
   - Para otros tipos de servicios, los recursos pasan a estado `ASIGNADO`

### Asignación Manual

Cuando `asignacionAutomatica` es `false` y se proporciona `asignacionesManual`, el sistema:

1. Verifica que cada recurso especificado esté disponible
2. Crea asignaciones según la estructura proporcionada
3. Cambia el estado de los recursos según el tipo de servicio:
   - Para servicios de `CAPACITACION`, los empleados pasan a estado `EN_CAPACITACION`
   - Para otros tipos de servicios, los recursos pasan a estado `ASIGNADO`

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

| Tipo Servicio         | Requiere Baños Nuevos | Requiere Baños Instalados | Requiere Vehículos | Campo cantidadBanos | Campo cantidadVehiculos | Campo banosInstalados | Estado de Empleados |
| --------------------- | :-------------------: | :-----------------------: | :----------------: | :-----------------: | :---------------------: | :-------------------: | :-----------------: |
| INSTALACION           |          Sí           |            No             |         Sí         |         > 0         |           > 0           |     No requerido      |      ASIGNADO       |
| LIMPIEZA              |          No           |            Sí             |         Sí         |          0          |           > 0           |       Requerido       |      ASIGNADO       |
| REEMPLAZO             |          No           |            Sí             |         Sí         |          0          |           > 0           |       Requerido       |      ASIGNADO       |
| RETIRO                |          No           |            Sí             |         Sí         |          0          |           > 0           |       Requerido       |      ASIGNADO       |
| MANTENIMIENTO_IN_SITU |          No           |            Sí             |         Sí         |          0          |           > 0           |       Requerido       |      ASIGNADO       |
| REPARACION            |          No           |            Sí             |         Sí         |          0          |           > 0           |       Requerido       |      ASIGNADO       |
| TRASLADO              |          Sí           |            No             |         Sí         |         > 0         |           > 0           |     No requerido      |      ASIGNADO       |
| REUBICACION           |          Sí           |            No             |         Sí         |         > 0         |           > 0           |     No requerido      |      ASIGNADO       |
| MANTENIMIENTO         |          Sí           |            No             |         Sí         |         > 0         |           > 0           |     No requerido      |      ASIGNADO       |
| CAPACITACION          |          No           |            No             |         No         |          0          |            0            |     No requerido      |   EN_CAPACITACION   |

**Nota:** Para los servicios que requieren baños ya instalados, el sistema verificará que los baños especificados existan y estén en estado ASIGNADO.

### Gestión de Baños Asignados

El sistema gestiona el ciclo de vida de los baños asignados a clientes de la siguiente manera:

1. **Servicio de INSTALACIÓN:** Los baños pasan a estado `ASIGNADO` y permanecen así hasta que se realice un servicio de `RETIRO`.
2. **Servicio de LIMPIEZA:** Opera sobre baños que ya están en estado `ASIGNADO` y los mantiene en ese estado.
3. **Servicio de REEMPLAZO:** Cambia los baños asignados pero mantiene la misma cantidad.
4. **Servicio de RETIRO:** Al completarse, cambia los baños de estado `ASIGNADO` a `EN_MANTENIMIENTO`.

Para obtener los baños asignados a un cliente específico, útil para crear servicios de LIMPIEZA o RETIRO:

```
GET /api/chemical_toilets/by-client/{clientId}
```

### Servicio de Capacitación

El servicio de tipo `CAPACITACION` tiene características específicas:

1. Solo requiere empleados, no utiliza vehículos ni baños
2. Siempre requiere exactamente 2 empleados (empleadoA y empleadoB)
3. Los empleados asignados cambian su estado a `EN_CAPACITACION` en lugar de `ASIGNADO`
4. Los empleados en estado `EN_CAPACITACION` no están disponibles para ser asignados a otros servicios
5. **La asignación de empleados siempre debe ser manual** (no se permite asignación automática)
6. Para crear un servicio de capacitación:
   - `asignacionAutomatica` debe ser `false`
   - Se deben especificar manualmente los empleados en `asignacionesManual`
   - `cantidadBanos` debe ser `0`
   - `cantidadVehiculos` debe ser `0`
   - No se debe especificar el campo `banosInstalados`
   - El servicio puede ser interno (sin cliente) o asociado a un cliente específico
7. Al completar o cancelar el servicio, los empleados vuelven al estado `DISPONIBLE`

## Estados de Servicio

| Estado      | Descripción                                                  | Transiciones Permitidas            |
| ----------- | ------------------------------------------------------------ | ---------------------------------- |
| PROGRAMADO  | Servicio con recursos asignados, listo para ejecutar         | EN_PROGRESO, CANCELADO, SUSPENDIDO |
| EN_PROGRESO | Servicio que se está ejecutando actualmente                  | COMPLETADO, SUSPENDIDO, INCOMPLETO |
| COMPLETADO  | Servicio finalizado correctamente                            | Ninguna                            |
| CANCELADO   | Servicio cancelado                                           | Ninguna                            |
| SUSPENDIDO  | Servicio temporalmente suspendido                            | EN_PROGRESO, CANCELADO             |
| INCOMPLETO  | Servicio que no pudo completarse por alguna razón específica | Ninguna                            |

## Estados de Recursos

### Estados de Empleados

| Estado          | Descripción                                           |
| --------------- | ----------------------------------------------------- |
| DISPONIBLE      | Empleado libre para ser asignado a cualquier servicio |
| ASIGNADO        | Empleado asignado a uno o más servicios regulares     |
| EN_CAPACITACION | Empleado asignado a un servicio de capacitación       |
| VACACIONES      | Empleado en período de vacaciones                     |
| LICENCIA        | Empleado en licencia (médica, personal, etc.)         |
| INACTIVO        | Empleado temporalmente inactivo                       |

### Estados de Vehículos y Baños

| Estado            | Descripción                               |
| ----------------- | ----------------------------------------- |
| DISPONIBLE        | Recurso disponible para ser asignado      |
| ASIGNADO          | Recurso asignado a uno o más servicios    |
| EN_MANTENIMIENTO  | Recurso en mantenimiento                  |
| FUERA_DE_SERVICIO | Recurso temporalmente no disponible       |
| BAJA              | Recurso permanentemente fuera de servicio |
| RESERVADO         | Recurso reservado para uso futuro         |

## Integración con Condiciones Contractuales

Los servicios de tipo `INSTALACION` pueden estar asociados a condiciones contractuales que definen los términos del alquiler:

1. Al crear un servicio de `INSTALACION`, se puede especificar un `condicionContractualId`.
2. Si se proporciona, el sistema utilizará la fecha de finalización del contrato para establecer la `fechaFinAsignacion` en el servicio.
3. Esta fecha indica cuándo los baños deben ser retirados automáticamente o programarse un servicio de `RETIRO`.

Si no se especifica un `condicionContractualId`, el sistema intentará buscar un contrato activo para el cliente y utilizará su fecha de finalización.

### Contratos Flexibles

El sistema permite configurar condiciones contractuales sin especificar el tipo de servicio ni la cantidad de baños:

1. **Contratos Marco**: Se puede crear una condición contractual solo con fechas, tarifas y periodicidad, dejando los campos `tipo_servicio` y `cantidad_banos` sin definir.

2. **Definición en el Servicio**: Cuando se crea un servicio asociado a un contrato flexible, se debe especificar el `tipoServicio` y `cantidadBanos` directamente en el servicio.

3. **Múltiples Servicios con Diferentes Características**: Un mismo contrato flexible puede utilizarse para diferentes tipos de servicios con distintas cantidades de baños, lo que permite mayor adaptabilidad a las necesidades del cliente.

Este enfoque es útil para:

- Contratos marco donde el cliente decidirá los detalles específicos más adelante
- Situaciones donde un mismo cliente requiere diferentes tipos de servicios durante el período contractual
- Casos donde la cantidad de baños puede variar a lo largo del contrato

## Estructura de Respuesta JSON

Las respuestas JSON del sistema están optimizadas para incluir solo campos relevantes. En particular, las asignaciones de recursos mostrarán únicamente los recursos que están efectivamente asignados, evitando campos nulos.

### Ejemplo de Asignación de Empleado

```json
{
  "id": 1,
  "servicioId": 3,
  "empleadoId": 1,
  "empleado": {
    "id": 1,
    "nombre": "Carlos",
    "apellido": "Rodríguez",
    "documento": "25789456",
    "telefono": "1145678901",
    "email": "carlos.rodriguez@example.com",
    "cargo": "Conductor",
    "estado": "ASIGNADO"
  },
  "fechaAsignacion": "2025-05-03T18:08:54.286Z"
}
```

### Ejemplo de Asignación de Vehículo

```json
{
  "id": 9,
  "servicioId": 3,
  "vehiculoId": 3,
  "vehiculo": {
    "id": 3,
    "numeroInterno": "VH-003",
    "placa": "AD789FF",
    "marca": "Toyota",
    "modelo": "Hilux",
    "anio": 2022,
    "tipoCabina": "doble",
    "fechaVencimientoVTV": "2026-07-19",
    "fechaVencimientoSeguro": "2026-09-24",
    "esExterno": false,
    "estado": "ASIGNADO"
  },
  "fechaAsignacion": "2025-05-03T18:01:06.513Z"
}
```

### Ejemplo de Asignación de Baño

```json
{
  "id": 10,
  "servicioId": 3,
  "banoId": 5,
  "bano": {
    "baño_id": 5,
    "codigo_interno": "BQ-2022-005",
    "modelo": "Portátil",
    "fecha_adquisicion": "2023-10-03T20:46:34.178Z",
    "estado": "ASIGNADO"
  },
  "fechaAsignacion": "2025-05-03T18:01:06.513Z"
}
```

### Ejemplo de Asignación Combinada

Si una asignación incluye varios tipos de recursos, todos aparecerán en la misma estructura:

```json
{
  "id": 6,
  "servicioId": 3,
  "empleadoId": 1,
  "empleado": {
    "id": 1,
    "nombre": "Carlos",
    "apellido": "Rodríguez",
    "documento": "25789456",
    "telefono": "1145678901",
    "email": "carlos.rodriguez@example.com",
    "cargo": "Conductor",
    "estado": "ASIGNADO"
  },
  "vehiculoId": 1,
  "vehiculo": {
    "id": 1,
    "numeroInterno": "VH-001",
    "placa": "AA123BB",
    "marca": "Ford",
    "modelo": "F-100",
    "anio": 2020,
    "tipoCabina": "simple",
    "fechaVencimientoVTV": "2026-05-14",
    "fechaVencimientoSeguro": "2026-07-19",
    "esExterno": false,
    "estado": "ASIGNADO"
  },
  "banoId": 4,
  "bano": {
    "baño_id": 4,
    "codigo_interno": "BQ-2022-004",
    "modelo": "Premium",
    "fecha_adquisicion": "2023-09-03T21:07:04.531Z",
    "estado": "ASIGNADO"
  },
  "fechaAsignacion": "2025-05-03T18:08:54.286Z"
}
```

Esta optimización reduce el tamaño de la respuesta JSON y facilita el procesamiento de los datos en el cliente.

## Manejo de Errores

La API devuelve códigos de error HTTP estándar junto con mensajes descriptivos:

- `400 Bad Request`: Parámetros inválidos
- `401 Unauthorized`: Token de autenticación faltante o inválido
- `403 Forbidden`: Permisos insuficientes para la operación
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto de recursos (por ejemplo, no hay suficientes recursos disponibles)
- `500 Internal Server Error`: Error del servidor

## Ejemplos de Flujos Completos

### 1. Flujo Básico de un Servicio con Contrato

1. **Crear un cliente y condición contractual**

   ```
   POST /api/clients
   {
     "nombre_empresa": "Constructora XYZ",
     "cuit": "30-71234572-5",
     "direccion": "Av. Libertador 1234",
     "telefono": "011-5678-9012",
     "email": "contacto@constructoraxyz.com",
     "contacto_principal": "Fernando López"
   }
   ```

   ```
   POST /api/contractual_conditions/create
   {
     "clientId": 1,
     "tipo_de_contrato": "Temporal",
     "fecha_inicio": "2025-05-01T00:00:00.000Z",
     "fecha_fin": "2025-06-30T00:00:00.000Z",
     "condiciones_especificas": "Contrato para obra pública",
     "tarifa": 2500,
     "periodicidad": "Mensual",
     "estado": "ACTIVO"
   }
   ```

2. **Crear un servicio de INSTALACIÓN con asignación automática vinculado al contrato**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-05-01T10:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 2,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. 9 de Julio 1000",
     "asignacionAutomatica": true,
     "condicionContractualId": 1
   }
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

5. **Verificar que los baños siguen ASIGNADOS al cliente**

   ```
   GET /api/chemical_toilets/by-client/1
   ```

6. **Crear un servicio de LIMPIEZA para los baños ya instalados**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-05-15T10:00:00.000Z",
     "tipoServicio": "LIMPIEZA",
     "cantidadBanos": 0,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. 9 de Julio 1000",
     "asignacionAutomatica": true,
     "banosInstalados": [1, 2]
   }
   ```

7. **Programar un servicio de RETIRO para la fecha de fin del contrato**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-06-30T10:00:00.000Z",
     "tipoServicio": "RETIRO",
     "cantidadBanos": 0,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. 9 de Julio 1000",
     "asignacionAutomatica": true,
     "banosInstalados": [1, 2]
   }
   ```

### 2. Flujo de Capacitación para Empleados

1. **Crear un servicio de CAPACITACION**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-05-10T09:00:00.000Z",
     "tipoServicio": "CAPACITACION",
     "cantidadBanos": 0,
     "cantidadVehiculos": 0,
     "ubicacion": "Sede central, Sala de conferencias",
     "notas": "Capacitación en nuevos procedimientos operativos",
     "asignacionAutomatica": true
   }
   ```

2. **Verificar que los empleados están en estado EN_CAPACITACION**

   ```
   GET /api/services/{id}
   GET /api/employees/{empleadoId}
   ```

3. **Iniciar el servicio de capacitación**

   ```
   PATCH /api/services/{id}/estado
   {
     "estado": "EN_PROGRESO"
   }
   ```

4. **Completar el servicio de capacitación**

   ```
   PATCH /api/services/{id}/estado
   {
     "estado": "COMPLETADO"
   }
   ```

5. **Verificar que los empleados han vuelto a estado DISPONIBLE**

   ```
   GET /api/employees/{empleadoId}
   ```

### 3. Modificación de Recursos Durante el Servicio

1. **Crear servicio inicial con 1 empleado, 1 vehículo, 1 baño**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-07-15T10:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 1,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. Sarmiento 500",
     "asignacionAutomatica": true
   }
   ```

2. **Aumentar la cantidad de recursos**

   ```
   PUT /api/services/{id}
   {
     "cantidadBanos": 2,
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
     "cantidadVehiculos": 1,
     "asignacionAutomatica": true
   }
   ```

5. **Verificar que se hayan liberado los recursos sobrantes**
   ```
   GET /api/services/{id}
   ```

### 4. Asignación de Recursos Múltiples a Varios Servicios

1. **Crear un primer servicio**

   ```
   POST /api/services
   {
     "clienteId": 1,
     "fechaProgramada": "2025-06-10T08:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 2,
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

### 5. Gestión de Servicios con Baños Ya Instalados

1. **Crear un servicio de LIMPIEZA para baños ya instalados**

   ```
   POST /api/services
   {
     "clienteId": 3,
     "fechaProgramada": "2025-06-15T09:00:00.000Z",
     "tipoServicio": "LIMPIEZA",
     "cantidadBanos": 0,
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
- Al crear un servicio de INSTALACIÓN, asocia una condición contractual para gestionar correctamente el período de alquiler
- Utiliza el endpoint `/api/chemical_toilets/by-client/{clientId}` para obtener los baños asignados a un cliente y usarlos en servicios de LIMPIEZA o RETIRO
- Para servicios de CAPACITACION, no olvides establecer cantidadBanos y cantidadVehiculos en 0, ya que estos recursos no se utilizan en este tipo de servicio
