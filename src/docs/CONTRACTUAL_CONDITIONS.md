# Documentación de la API de Condiciones Contractuales (MVA Backend)

## Índice

1. Introducción
2. Autenticación
3. Endpoints de Condiciones Contractuales
   - 1. Obtener Todas las Condiciones Contractuales
   - 2. Obtener una Condición Contractual Específica
   - 3. Obtener Condiciones Contractuales por Cliente
   - 4. Crear una Nueva Condición Contractual
   - 5. Modificar una Condición Contractual
   - 6. Eliminar una Condición Contractual
4. Modelos de Datos
   - Tipos de Contrato
   - Periodicidades
   - Estados de Contrato
5. Integración con Servicios de Instalación
6. Ejemplos de Uso
   - Ciclo de Vida de un Contrato
   - Actualización de Tarifas
   - Creación de Servicio de Instalación Vinculado
   - Contrato Flexible con Definición de Servicio Posterior
7. Manejo de Errores
8. Consideraciones Importantes

## Introducción

La API de Condiciones Contractuales permite gestionar los acuerdos comerciales entre la empresa y sus clientes. Estos acuerdos definen las tarifas, periodicidades, fechas de vigencia y otras condiciones específicas que rigen la prestación de servicios relacionados con los baños químicos. Los contratos están directamente vinculados con los servicios de instalación y definen el período durante el cual los baños permanecen asignados al cliente.

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

## Endpoints de Condiciones Contractuales

### 1. Obtener Todas las Condiciones Contractuales

**Endpoint:** `GET /api/contractual_conditions`  
**Roles permitidos:** ADMIN  
**Descripción:** Recupera todas las condiciones contractuales almacenadas en el sistema con soporte para paginación.

**Parámetros de consulta:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|--------|-----------|--------------------------------------------------|
| page | number | No | Número de página a recuperar (por defecto: 1) |
| limit | number | No | Resultados por página (por defecto: 10) |

**Ejemplos:**

```
GET /api/contractual_conditions
GET /api/contractual_conditions?page=2&limit=20
```

**Respuesta Exitosa (200 OK):**

```json
{
  "items": [
    {
      "condicionContractualId": 1,
      "cliente": {
        "clienteId": 1,
        "nombre": "Constructora ABC",
        "cuit": "30-71234567-0"
      },
      "tipo_de_contrato": "Permanente",
      "fecha_inicio": "2025-01-01",
      "fecha_fin": "2025-12-31",
      "condiciones_especificas": "Incluye servicio de limpieza semanal sin costo adicional",
      "tarifa": "2500.00",
      "periodicidad": "Mensual",
      "estado": "Activo"
    },
    {
      "condicionContractualId": 2,
      "cliente": {
        "clienteId": 2,
        "nombre": "Eventos del Sur",
        "cuit": "30-71234568-1"
      },
      "tipo_de_contrato": "Temporal",
      "fecha_inicio": "2025-05-01",
      "fecha_fin": "2025-05-31",
      "condiciones_especificas": "Alquiler con mantenimiento incluido",
      "tarifa": "1800.00",
      "periodicidad": "Diaria",
      "estado": "Activo"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### 2. Obtener una Condición Contractual Específica

**Endpoint:** `GET /api/contractual_conditions/id/{id}`  
**Roles permitidos:** ADMIN  
**Descripción:** Recupera una condición contractual específica por su ID.

**Ejemplo:**

```
GET /api/contractual_conditions/id/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "condicionContractualId": 1,
  "cliente": {
    "clienteId": 1,
    "nombre": "Constructora ABC",
    "cuit": "30-71234567-0"
  },
  "tipo_de_contrato": "Permanente",
  "fecha_inicio": "2025-01-01",
  "fecha_fin": "2025-12-31",
  "condiciones_especificas": "Incluye servicio de limpieza semanal sin costo adicional",
  "tarifa": "2500.00",
  "periodicidad": "Mensual",
  "estado": "Activo"
}
```

### 3. Obtener Condiciones Contractuales por Cliente

**Endpoint:** `GET /api/contractual_conditions/client-id/{clientId}`  
**Roles permitidos:** ADMIN  
**Descripción:** Recupera todas las condiciones contractuales asociadas a un cliente específico.

**Ejemplo:**

```
GET /api/contractual_conditions/client-id/1
```

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "condicionContractualId": 1,
    "cliente": {
      "clienteId": 1,
      "nombre": "Constructora ABC",
      "cuit": "30-71234567-0"
    },
    "tipo_de_contrato": "Permanente",
    "fecha_inicio": "2025-01-01",
    "fecha_fin": "2025-12-31",
    "condiciones_especificas": "Incluye servicio de limpieza semanal sin costo adicional",
    "tarifa": "2500.00",
    "periodicidad": "Mensual",
    "estado": "Activo"
  },
  {
    "condicionContractualId": 3,
    "cliente": {
      "clienteId": 1,
      "nombre": "Constructora ABC",
      "cuit": "30-71234567-0"
    },
    "tipo_de_contrato": "Temporal",
    "fecha_inicio": "2025-06-01",
    "fecha_fin": "2025-08-31",
    "condiciones_especificas": "Contrato de verano",
    "tarifa": "3000.00",
    "periodicidad": "Mensual",
    "estado": "Activo"
  }
]
```

### 4. Crear una Nueva Condición Contractual

**Endpoint:** `POST /api/contractual_conditions/create`  
**Roles permitidos:** ADMIN  
**Descripción:** Crea una nueva condición contractual para un cliente.

**Request Body:**

Se pueden crear condiciones contractuales de dos formas:

#### A. Con tipo de servicio y cantidad de baños especificados

```json
{
  "clientId": 1,
  "tipo_de_contrato": "Temporal",
  "fecha_inicio": "2025-05-10T00:00:00.000Z",
  "fecha_fin": "2025-06-10T00:00:00.000Z",
  "condiciones_especificas": "Contrato para evento de 30 días",
  "tarifa": 3000,
  "periodicidad": "Semanal",
  "estado": "Activo",
  "tipo_servicio": "INSTALACION",
  "cantidad_banos": 5,
  "tarifa_alquiler": 2000,
  "tarifa_instalacion": 500,
  "tarifa_limpieza": 300
}
```

#### B. Sin tipo de servicio ni cantidad de baños (contrato marco flexible)

```json
{
  "clientId": 2,
  "tipo_de_contrato": "Temporal",
  "fecha_inicio": "2025-06-10T00:00:00.000Z",
  "fecha_fin": "2025-07-10T00:00:00.000Z",
  "condiciones_especificas": "Contrato para obra de construcción. Cliente regulará los servicios según necesidad.",
  "tarifa": 2500,
  "tarifa_alquiler": 1500,
  "tarifa_instalacion": 400,
  "tarifa_limpieza": 250,
  "periodicidad": "Semanal",
  "estado": "Activo"
}
```

| Campo                   | Tipo               | Requerido | Descripción                                                    |
| ----------------------- | ------------------ | --------- | -------------------------------------------------------------- |
| clientId                | number             | Sí        | ID del cliente al que se aplica el contrato                    |
| tipo_de_contrato        | string (enum)      | Sí        | Tipo de contrato: "Temporal" o "Permanente"                    |
| fecha_inicio            | string (fecha ISO) | Sí        | Fecha de inicio del contrato                                   |
| fecha_fin               | string (fecha ISO) | Sí        | Fecha de finalización del contrato                             |
| condiciones_especificas | string             | No        | Texto libre para condiciones adicionales (máx. 500 caracteres) |
| tarifa                  | number             | Sí        | Monto a cobrar según la periodicidad establecida               |
| tarifa_alquiler         | number             | No        | Tarifa específica para el alquiler de los baños                |
| tarifa_instalacion      | number             | No        | Tarifa específica para la instalación de los baños             |
| tarifa_limpieza         | number             | No        | Tarifa específica para la limpieza de los baños                |
| tipo_servicio           | string (enum)      | No        | Tipo de servicio específico para el contrato                   |
| cantidad_banos          | number             | No        | Cantidad de baños establecida en el contrato                   |
| periodicidad            | string (enum)      | Sí        | "Diaria", "Dos veces por semana", "Tres veces por semana", "Cuatro veces por semana", "Semanal", "Quincenal", "Mensual" o "Anual" |
| estado                  | string (enum)      | No        | "Activo", "Inactivo" o "Terminado" (default: "Activo")         |

**Respuesta Exitosa (200 OK):**

```json
{
  "condicionContractualId": 5,
  "cliente": {
    "clienteId": 1,
    "nombre": "Constructora ABC",
    "cuit": "30-71234567-0"
  },
  "tipo_de_contrato": "Permanente",
  "fecha_inicio": "2025-01-01",
  "fecha_fin": "2025-12-31",
  "condiciones_especificas": "Incluye servicio de limpieza semanal sin costo adicional",
  "tarifa": "2500.00",
  "periodicidad": "Mensual",
  "estado": "Activo",
  "tipo_servicio": "INSTALACION",
  "cantidad_banos": 5,
  "tarifa_alquiler": "2000.00",
  "tarifa_instalacion": "500.00",
  "tarifa_limpieza": "300.00"
}
```

### 5. Modificar una Condición Contractual

**Endpoint:** `PUT /api/contractual_conditions/modify/{id}`  
**Roles permitidos:** ADMIN  
**Descripción:** Modifica una condición contractual existente.

**Ejemplo:**

```
PUT /api/contractual_conditions/modify/1
```

**Request Body:**

```json
{
  "tarifa": 2800,
  "condiciones_especificas": "Incluye servicio de limpieza semanal y descuento por volumen",
  "estado": "Inactivo"
}
```

Todos los campos son opcionales. Solo se actualizan los campos incluidos en la solicitud.

**Respuesta Exitosa (200 OK):**

```json
{
  "condicionContractualId": 1,
  "cliente": {
    "clienteId": 1,
    "nombre": "Constructora ABC",
    "cuit": "30-71234567-0"
  },
  "tipo_de_contrato": "Permanente",
  "fecha_inicio": "2025-01-01",
  "fecha_fin": "2025-12-31",
  "condiciones_especificas": "Incluye servicio de limpieza semanal y descuento por volumen",
  "tarifa": "2800.00",
  "periodicidad": "Mensual",
  "estado": "Inactivo"
}
```

### 6. Eliminar una Condición Contractual

**Endpoint:** `DELETE /api/contractual_conditions/delete/{id}`  
**Roles permitidos:** ADMIN  
**Descripción:** Elimina una condición contractual específica.

**Ejemplo:**

```
DELETE /api/contractual_conditions/delete/5
```

**Respuesta Exitosa (200 OK):**

```json
"Contractual Condition with ID 5 has been deleted"
```

## Modelos de Datos

### Tipos de Contrato

| Tipo       | Descripción                                                           |
| ---------- | --------------------------------------------------------------------- |
| Temporal   | Para servicios de corta duración (eventos, construcciones temporales) |
| Permanente | Para servicios continuados o de larga duración                        |

### Periodicidades

| Periodicidad              | Descripción                                    | Intervalo Aproximado |
| ------------------------- | ---------------------------------------------- | -------------------- |
| Diaria                    | Tarifa aplicada por día                        | 1 día                |
| Dos veces por semana      | Servicio prestado dos veces por semana         | 3.5 días             |
| Tres veces por semana     | Servicio prestado tres veces por semana       | 2.33 días            |
| Cuatro veces por semana   | Servicio prestado cuatro veces por semana     | 1.75 días            |
| Semanal                   | Tarifa aplicada por semana                     | 7 días               |
| Quincenal                 | Tarifa aplicada por quincena                   | 15 días              |
| Mensual                   | Tarifa aplicada por mes                        | 30 días              |
| Anual                     | Tarifa aplicada por año                        | 365 días             |

### Estados de Contrato

| Estado    | Descripción                       |
| --------- | --------------------------------- |
| Activo    | Contrato vigente y operativo      |
| Inactivo  | Contrato temporalmente suspendido |
| Terminado | Contrato finalizado o cancelado   |

## Integración con Servicios de Instalación

Las condiciones contractuales están directamente relacionadas con los servicios de instalación de baños químicos:

1. **Vinculación de Servicios de Instalación con Contratos:**

   - Al crear un servicio de INSTALACIÓN, se puede especificar el `condicionContractualId` para vincularlo a un contrato existente.
   - El sistema usará la fecha de finalización del contrato (`fecha_fin`) para establecer la fecha de finalización de asignación de los baños (`fechaFinAsignacion`).
   - Esto determina hasta cuándo los baños permanecerán asignados al cliente.

2. **Comportamiento de Asignación:**

   - Los baños instalados mediante un servicio vinculado a un contrato permanecerán en estado ASIGNADO hasta la fecha de finalización del contrato o hasta que se realice explícitamente un servicio de RETIRO.

3. **Búsqueda Automática de Contratos:**

   - Si al crear un servicio de INSTALACIÓN no se especifica un `condicionContractualId`, el sistema buscará automáticamente un contrato activo para el cliente y utilizará su fecha de finalización.
   - Si hay múltiples contratos activos, se utilizará el que tenga la fecha de finalización más lejana.

4. **Consulta de Baños Asignados:**
   - Para obtener la lista de baños asignados a un cliente (útil para crear servicios de LIMPIEZA o RETIRO):
   ```
   GET /api/chemical_toilets/by-client/{clientId}
   ```

## Ejemplos de Uso

### Ciclo de Vida de un Contrato

1. **Crear un contrato para un nuevo cliente**

   ```http
   POST /api/contractual_conditions/create
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "clientId": 3,
     "tipo_de_contrato": "Temporal",
     "fecha_inicio": "2025-06-01T00:00:00.000Z",
     "fecha_fin": "2025-08-31T00:00:00.000Z",
     "condiciones_especificas": "Contrato para obra en construcción",
     "tarifa": 4500,
     "periodicidad": "Mensual"
   }
   ```

2. **Verificar las condiciones creadas**

   ```http
   GET /api/contractual_conditions/client-id/3
   Authorization: Bearer {{token}}
   ```

3. **Actualizar una condición contractual (por ejemplo, al renovar)**

   ```http
   PUT /api/contractual_conditions/modify/6
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "fecha_fin": "2025-12-31T00:00:00.000Z",
     "tarifa": 5000,
     "condiciones_especificas": "Renovación de contrato para obra en construcción con tarifa actualizada"
   }
   ```

4. **Finalizar un contrato**

   ```http
   PUT /api/contractual_conditions/modify/6
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "estado": "Terminado"
   }
   ```

### Actualización de Tarifas

1. **Listar todas las condiciones contractuales activas**

   ```http
   GET /api/contractual_conditions
   Authorization: Bearer {{token}}
   ```

2. **Actualizar la tarifa de un contrato específico**

   ```http
   PUT /api/contractual_conditions/modify/2
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "tarifa": 2000
   }
   ```

### Creación de Servicio de Instalación Vinculado

1. **Crear un contrato**

   ```http
   POST /api/contractual_conditions/create
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "clientId": 4,
     "tipo_de_contrato": "Temporal",
     "fecha_inicio": "2025-05-01T00:00:00.000Z",
     "fecha_fin": "2025-06-30T00:00:00.000Z",
     "condiciones_especificas": "Contrato para evento de verano",
     "tarifa": 3500,
     "periodicidad": "Mensual"
   }
   ```

2. **Vincular un servicio de instalación al contrato**

   ```http
   POST /api/services
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "clienteId": 4,
     "fechaProgramada": "2025-05-01T08:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 3,
     "cantidadEmpleados": 2,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. del Libertador 4500",
     "notas": "Instalación para evento de verano",
     "asignacionAutomatica": true,
     "condicionContractualId": 7
   }
   ```

3. **Verificar que los baños siguen asignados después de completar el servicio**

   Primero, iniciar el servicio:

   ```http
   PATCH /api/services/{servicioId}/estado
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "estado": "EN_PROGRESO"
   }
   ```

   Luego, completar el servicio:

   ```http
   PATCH /api/services/{servicioId}/estado
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "estado": "COMPLETADO"
   }
   ```

   Finalmente, verificar los baños asignados:

   ```http
   GET /api/chemical_toilets/by-client/4
   Authorization: Bearer {{token}}
   ```

### Contrato Flexible con Definición de Servicio Posterior

1. **Crear un contrato sin especificar tipo de servicio ni cantidad de baños**

   ```http
   POST /api/contractual_conditions/create
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "clientId": 5,
     "tipo_de_contrato": "Temporal",
     "fecha_inicio": "2025-06-10T00:00:00.000Z",
     "fecha_fin": "2025-07-10T00:00:00.000Z",
     "condiciones_especificas": "Contrato para obra de construcción. Cliente regulará los servicios según necesidad.",
     "tarifa": 2500,
     "tarifa_alquiler": 1500,
     "tarifa_instalacion": 400,
     "tarifa_limpieza": 250,
     "periodicidad": "Semanal",
     "estado": "Activo"
   }
   ```

2. **Crear un servicio especificando el tipo y cantidad explícitamente**

   ```http
   POST /api/services
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "clienteId": 5,
     "fechaProgramada": "2025-06-15T10:00:00.000Z",
     "tipoServicio": "INSTALACION",
     "cantidadBanos": 3,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. Corrientes 1234, Buenos Aires",
     "notas": "Cliente solicitó entrega antes de las 9am",
     "asignacionAutomatica": true,
     "condicionContractualId": 9
   }
   ```

3. **Crear otro servicio del mismo contrato con diferente tipo y cantidad**

   ```http
   POST /api/services
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "clienteId": 5,
     "fechaProgramada": "2025-06-25T14:00:00.000Z",
     "tipoServicio": "MANTENIMIENTO_IN_SITU",
     "cantidadBanos": 0,
     "cantidadVehiculos": 1,
     "ubicacion": "Av. Corrientes 1234, Buenos Aires",
     "notas": "Mantenimiento mensual acordado",
     "asignacionAutomatica": true,
     "condicionContractualId": 9,
     "banosInstalados": [10, 11, 12]
   }
   ```

Este enfoque flexible permite crear un único contrato marco que puede utilizarse para distintos tipos de servicios a lo largo de su vigencia, adaptándose a las necesidades cambiantes del cliente.

## Manejo de Errores

### Respuesta de Error (404 Not Found)

```json
{
  "message": "Contractual Condition with ID: 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Respuesta de Error (400 Bad Request)

```json
{
  "message": "Client with ID: 999 not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error en la Paginación

```json
{
  "message": "Invalid pagination parameters: \"page\" and \"limit\" must both be greater than 0. Received page=0, limit=10.",
  "error": "Bad Request",
  "statusCode": 400
}
```

## Consideraciones Importantes

1. **Relación con Clientes**: Las condiciones contractuales siempre están asociadas a un cliente existente. Antes de crear una condición contractual, asegúrate de que el cliente exista en el sistema.

2. **Superposición de Contratos**: El sistema permite tener múltiples contratos activos para el mismo cliente, lo que puede ser útil para diferentes servicios o ubicaciones. Asegúrate de gestionar esto adecuadamente.

3. **Estados de Contrato**:

   - Los contratos se crean por defecto en estado "Activo"
   - Un contrato "Inactivo" puede ser reactivado cambiando su estado a "Activo"
   - Un contrato "Terminado" no debería modificarse nuevamente

4. **Fechas de Contrato**:

   - La fecha de inicio debe ser anterior a la fecha de fin
   - Para contratos de larga duración, considera utilizar fechas de fin lejanas

5. **Tarifas y Periodicidad**: Asegúrate de especificar correctamente la periodicidad junto con la tarifa para evitar confusiones en la facturación:

   - Una tarifa de 2000 con periodicidad "Diaria" significa $2000 por día
   - Una tarifa de 2000 con periodicidad "Mensual" significa $2000 por mes

6. **Condiciones Específicas**: Utiliza este campo para detallar cualquier acuerdo especial que no esté cubierto por los otros campos (descuentos especiales, servicios adicionales, requisitos particulares).

7. **Vinculación con Servicios**: Al crear un servicio de instalación, siempre intenta vincularlo a un contrato mediante el campo `condicionContractualId` para asegurar una correcta gestión del ciclo de vida de los baños asignados.

8. **Fecha de Fin de Asignación**: Esta fecha, derivada del contrato, determina hasta cuándo los baños permanecerán asignados al cliente. Planifica adecuadamente los servicios de retiro para coincidir con esta fecha o asegúrate de modificar el contrato si es necesario extender el período de asignación.
