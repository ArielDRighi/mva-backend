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
4. Sistema de Control de Días de Vacaciones
5. Verificación de Disponibilidad
6. Ejemplos de Uso
7. Integración con Servicios

## Introducción

El módulo de Licencias y Vacaciones permite gestionar los períodos de ausencia programada de los empleados. Esto es crucial para la planificación de servicios, ya que permite saber cuándo un empleado no estará disponible para ser asignado a un trabajo.

## Endpoints de Licencias y Vacaciones

### 1. Crear una Licencia/Vacación

**Endpoint:** `POST /api/employee-leaves`  
**Roles permitidos:** Todos los autenticados

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

**Validaciones:**

- Verifica que el empleado exista
- Verifica que la fecha de fin sea posterior a la fecha de inicio
- Verifica que no haya solapamiento con otras licencias del mismo empleado

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
      "cargo": "Conductor",
      "diasVacacionesDisponibles": 15,
      "diasVacacionesRestantes": 0,
      "diasVacacionesUsados": 15
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
      "cargo": "Técnico",
      "diasVacacionesDisponibles": 15,
      "diasVacacionesRestantes": 10,
      "diasVacacionesUsados": 5
    }
  }
]
```

### 3. Obtener una Licencia/Vacación Específica

**Endpoint:** `GET /api/employee-leaves/:id`  
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
    "cargo": "Conductor",
    "diasVacacionesDisponibles": 15,
    "diasVacacionesRestantes": 0,
    "diasVacacionesUsados": 15
  }
}
```

### 4. Obtener Licencias por Empleado

**Endpoint:** `GET /api/employee-leaves/employee/:id`  
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
    "aprobado": true,
    "employee": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "documento": "12345678",
      "cargo": "Conductor",
      "diasVacacionesDisponibles": 15,
      "diasVacacionesRestantes": 0,
      "diasVacacionesUsados": 15
    }
  },
  {
    "id": 3,
    "employeeId": 1,
    "fechaInicio": "2025-08-10",
    "fechaFin": "2025-08-15",
    "tipoLicencia": "CAPACITACION",
    "notas": "Curso de manejo defensivo",
    "aprobado": false,
    "employee": {
      "id": 1,
      "nombre": "Juan",
      "apellido": "Pérez",
      "documento": "12345678",
      "cargo": "Conductor",
      "diasVacacionesDisponibles": 15,
      "diasVacacionesRestantes": 0,
      "diasVacacionesUsados": 15
    }
  }
]
```

### 5. Actualizar una Licencia/Vacación

**Endpoint:** `PATCH /api/employee-leaves/:id`  
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

**Validaciones:**

- Si se actualiza el empleado, verifica que el nuevo empleado exista
- Si se actualizan las fechas, verifica que no haya solapamiento con otras licencias
- Si se actualizan las fechas, verifica que el empleado tenga suficientes días disponibles
- Verifica que la fecha de fin sea posterior a la fecha de inicio

### 6. Aprobar una Licencia/Vacación

**Endpoint:** `PATCH /api/employee-leaves/:id/approve`  
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
  "aprobado": true,
  "employee": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Pérez",
    "documento": "12345678",
    "cargo": "Conductor",
    "diasVacacionesDisponibles": 15,
    "diasVacacionesRestantes": 0,
    "diasVacacionesUsados": 15
  }
}
```

**Comportamiento:**

- Verifica que la licencia no esté ya aprobada
- Calcula los días totales de la licencia
- Verifica que el empleado tenga suficientes días disponibles
- Reduce los días disponibles y aumenta los días usados del empleado
- Marca la licencia como aprobada

### 7. Eliminar una Licencia/Vacación

**Endpoint:** `DELETE /api/employee-leaves/:id`  
**Roles permitidos:** ADMIN

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

## Sistema de Control de Días de Vacaciones

El sistema mantiene un registro de los días de vacaciones disponibles, utilizados y acumulados de cada empleado. Esta información se almacena en la entidad de empleados y se actualiza automáticamente cuando se aprueban solicitudes de vacaciones.

### Campos Relacionados con Vacaciones en la Entidad Empleado

| Campo                     | Tipo   | Descripción                                                                           |
| ------------------------- | ------ | ------------------------------------------------------------------------------------- |
| diasVacacionesDisponibles | number | Cantidad de días de vacaciones que el empleado puede solicitar en el período actual   |
| diasVacacionesRestantes   | number | Días de vacaciones que aún no ha utilizado el empleado (se actualiza automáticamente) |
| diasVacacionesUsados      | number | Días de vacaciones que ya ha utilizado el empleado en el período actual               |

### Comportamiento del Sistema de Vacaciones

1. **Asignación Inicial**: Cuando se crea un nuevo empleado, se le asigna automáticamente un valor predeterminado de días de vacaciones (generalmente 15 días anuales).

2. **Solicitud de Vacaciones**: Cuando un empleado solicita vacaciones a través del endpoint `POST /api/employee-leaves`, el sistema verifica que el período no se solape con otras licencias.

3. **Aprobación de Vacaciones**: Al aprobar una solicitud de vacaciones mediante `PATCH /api/employee-leaves/:id/approve`:

   - El sistema calcula los días totales dentro del período solicitado
   - Verifica que el empleado tenga suficientes días disponibles
   - Reduce la cantidad de `diasVacacionesRestantes` del empleado
   - Aumenta la cantidad de `diasVacacionesUsados` del empleado

4. **Acumulación Anual**: El sistema puede aumentar automáticamente los días de vacaciones disponibles según políticas de la empresa (generalmente realizado por un proceso programado anual).

5. **Ajuste Manual**: Los administradores pueden ajustar manualmente la cantidad de días disponibles utilizando el endpoint `PUT /api/employees/{id}`.

### Validaciones del Sistema

- No se pueden aprobar solicitudes de vacaciones que excedan los días disponibles del empleado
- No se pueden programar períodos de vacaciones superpuestos
- La fecha de fin debe ser posterior a la fecha de inicio

## Verificación de Disponibilidad

El sistema proporciona métodos internos para verificar la disponibilidad de empleados en fechas específicas. Estos métodos son utilizados principalmente por el módulo de servicios para determinar qué empleados pueden ser asignados a servicios en fechas específicas.

### Métodos de Verificación

1. **isEmployeeAvailable(employeeId, fecha)**

   - Verifica si un empleado específico está disponible en una fecha concreta
   - Utilizado durante la asignación de empleados a servicios

2. **getActiveLeaves(fecha)**
   - Obtiene todas las licencias activas/programadas para una fecha específica
   - Utilizado para reportes y planificación de personal

Estos métodos verifican si hay licencias aprobadas para un empleado que se solapen con la fecha en cuestión, permitiendo una correcta asignación de recursos humanos.

## Ejemplos de Uso

### Verificar Días de Vacaciones Disponibles

```
GET /api/employees/1
```

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  // ...otros campos...
  "diasVacacionesDisponibles": 15,
  "diasVacacionesRestantes": 10,
  "diasVacacionesTotales": 15
}
```

### Solicitar Vacaciones

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

### Aprobar la Solicitud de Vacaciones

```
PATCH /api/employee-leaves/1/approve
Authorization: Bearer {token}
```

**Después de la aprobación, los días de vacaciones restantes del empleado se actualizarán:**

```
GET /api/employees/1
```

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  // ...otros campos...
  "diasVacacionesDisponibles": 15,
  "diasVacacionesRestantes": 0, // Actualizado automáticamente después de la aprobación
  "diasVacacionesTotales": 15
}
```

### Aumentar Días de Vacaciones Disponibles (Administrador)

```
PUT /api/employees/1
Content-Type: application/json
Authorization: Bearer {token}

{
  "diasVacacionesDisponibles": 20
}
```

**Respuesta:**

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Pérez",
  // ...otros campos...
  "diasVacacionesDisponibles": 20,
  "diasVacacionesRestantes": 5, // Actualizado automáticamente
  "diasVacacionesTotales": 20
}
```

## Integración con Servicios

El módulo de licencias y vacaciones se integra con el sistema de asignación de servicios para garantizar que no se asignen empleados que estarán ausentes durante el período programado para un servicio.

Cuando se programa un nuevo servicio, el sistema verificará automáticamente si los empleados disponibles tienen licencias o vacaciones programadas para la fecha del servicio, y solo considerará a aquellos que estarán realmente disponibles.

### Ejemplo de flujo integrado:

1. Se programan vacaciones para el empleado Juan Pérez del 15 al 30 de mayo de 2025
2. Se aprueban las vacaciones
3. Se intenta crear un servicio para el 20 de mayo de 2025 que requiere un conductor
4. Aunque Juan Pérez es conductor y actualmente tiene estado "DISPONIBLE", el sistema no lo considerará para este servicio porque estará de vacaciones en esa fecha

## Manejo de Errores

### Empleado no encontrado

**Respuesta de Error (404 Not Found):**

```json
{
  "message": "Empleado con ID 999 no encontrado",
  "statusCode": 404
}
```

### Licencia no encontrada

**Respuesta de Error (404 Not Found):**

```json
{
  "message": "Licencia con ID 999 no encontrada",
  "statusCode": 404
}
```

### Solapamiento con otra licencia

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "El empleado ya tiene una licencia programada que se solapa con las fechas solicitadas",
  "statusCode": 400
}
```

### Días insuficientes

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "El empleado no tiene suficientes días de licencia disponibles",
  "statusCode": 400
}
```

### Licencia ya aprobada

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "La licencia con ID 1 ya está aprobada",
  "statusCode": 400
}
```

### Fechas inválidas

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "La fecha de fin debe ser posterior a la fecha de inicio",
  "statusCode": 400
}
```

# Probando Licencias/Vacaciones y su Impacto en la Creación de Servicios

Para probar cómo las licencias y vacaciones afectan la asignación de empleados a servicios, necesitarás seguir estos pasos en Postman:

## 1. Crear una Licencia/Vacación para un Empleado

### Paso 1: Crear la licencia/vacación

```
POST /api/employee-leaves
```

**Headers:**

- Content-Type: application/json
- Authorization: Bearer {tu_token}

**Body:**

```json
{
  "employeeId": 1,
  "fechaInicio": "2025-05-15T00:00:00.000Z",
  "fechaFin": "2025-05-30T00:00:00.000Z",
  "tipoLicencia": "VACACIONES",
  "notas": "Vacaciones anuales programadas"
}
```

> 📝 **Nota:** Reemplaza `employeeId` con el ID de un empleado existente en tu sistema y ajusta las fechas según necesites. Usa una fecha próxima para facilitar las pruebas.

### Paso 2: Aprobar la licencia/vacación creada

```
PATCH /api/employee-leaves/{id}/approve
```

**Headers:**

- Authorization: Bearer {tu_token}

> 📝 **Nota:** Reemplaza `{id}` con el ID de la licencia que acabas de crear.

### Paso 3: Verificar que el estado del empleado ha cambiado automáticamente

```
GET /api/employees/{id}
```

**Headers:**

- Authorization: Bearer {tu_token}

> El sistema actualizará automáticamente el estado del empleado a "NO_DISPONIBLE" cuando llegue la fecha de inicio de la licencia (mediante el scheduler).

## 2. Intentar Crear un Servicio Durante ese Período

### Paso 1: Crear un servicio con asignación automática

```
POST /api/services
```

**Headers:**

- Content-Type: application/json
- Authorization: Bearer {tu_token}

**Body:**

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-20T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "estado": "PROGRAMADO",
  "cantidadBanos": 2,
  "cantidadEmpleados": 1,
  "cantidadVehiculos": 1,
  "ubicacion": "Avenida Principal 123",
  "notas": "Instalación estándar",
  "asignacionAutomatica": true
}
```

> 📝 **Nota:** La fecha del servicio debe estar dentro del período de vacaciones/licencia del empleado.

### Paso 2: Verificar el resultado

- Si el sistema funciona correctamente, el empleado en vacaciones/licencia no debería ser asignado automáticamente al servicio.
- Deberías ver otros empleados asignados, o recibir un error si no hay suficientes empleados disponibles.

### Paso 3: Intentar asignar manualmente al empleado en licencia

```
POST /api/services
```

**Headers:**

- Content-Type: application/json
- Authorization: Bearer {tu_token}

**Body:**

```json
{
  "clienteId": 1,
  "fechaProgramada": "2025-05-20T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "estado": "PROGRAMADO",
  "cantidadBanos": 2,
  "cantidadEmpleados": 1,
  "cantidadVehiculos": 1,
  "ubicacion": "Avenida Principal 123",
  "notas": "Instalación estándar",
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 1,
      "vehiculoId": 1,
      "banosIds": [1, 2]
    }
  ]
}
```

> El sistema debería rechazar esta asignación manual, ya que el empleado estará en vacaciones/licencia durante esa fecha.

## 3. Crear un Servicio Fuera del Período de Licencia

Repite los pasos anteriores pero con una fecha fuera del período de licencia/vacaciones. El empleado debería poder ser asignado normalmente.

## 4. Verificar Finalización de Licencia

### Paso 1: Esperar a que se ejecute el scheduler al llegar la fecha de fin

El scheduler automáticamente cambiará el estado del empleado a "DISPONIBLE" cuando llegue la fecha de finalización de la licencia.

> 📝 **Nota:** Para pruebas, puedes simular esto cambiando manualmente el estado del empleado:

```
PATCH /api/employees/{id}/estado
```

**Headers:**

- Content-Type: application/json
- Authorization: Bearer {tu_token}

**Body:**

```json
{
  "estado": "DISPONIBLE"
}
```

### Paso 2: Verificar que el empleado puede ser asignado nuevamente a servicios

Repite la creación de un servicio con fecha posterior al fin de la licencia.

## Consideraciones Importantes

1. **Fechas de prueba:** Usa fechas cercanas al día actual para ver el efecto del scheduler. Alternativamente, puedes modificar manualmente los estados para probar la lógica.

2. **Verificación del sistema de asignación:** El sistema debe verificar:

   - Si un empleado está en licencia en la fecha de un servicio
   - No permitir asignación manual de empleados en licencia
   - No incluir empleados en licencia para asignación automática

3. **Logs del sistema:** Verifica los logs del servidor para ver mensajes informativos sobre:

   - Empleados que inician licencia
   - Empleados que finalizan licencia
   - Intentos de asignación rechazados por licencia

4. **Base de datos:** Puedes verificar directamente en la base de datos:
   - La tabla `employee_leaves` para ver las licencias registradas
   - La tabla de empleados para confirmar su estado
   - La tabla de asignaciones para verificar que los empleados en licencia no estén asignados

Para simular adecuadamente el comportamiento del scheduler sin esperar a que las fechas lleguen naturalmente, puedes modificar temporalmente las fechas de inicio y fin de la licencia para que coincidan con la fecha actual, lo que activará el scheduler en su próxima ejecución.
