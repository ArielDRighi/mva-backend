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
5. Ejemplos de Uso
   - Ciclo de Vida de un Contrato
   - Actualización de Tarifas
6. Manejo de Errores
7. Consideraciones Importantes

## Introducción

La API de Condiciones Contractuales permite gestionar los acuerdos comerciales entre la empresa y sus clientes. Estos acuerdos definen las tarifas, periodicidades, fechas de vigencia y otras condiciones específicas que rigen la prestación de servicios relacionados con los baños químicos.

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
**Roles permitidos:** Todos los usuarios autenticados  
**Descripción:** Recupera todas las condiciones contractuales almacenadas en el sistema.

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
]
```

### 2. Obtener una Condición Contractual Específica

**Endpoint:** `GET /api/contractual_conditions/id/{id}`  
**Roles permitidos:** Todos los usuarios autenticados  
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

**Endpoint:** `GET /api/contractual_conditions/client-name/{clientId}`  
**Roles permitidos:** Todos los usuarios autenticados  
**Descripción:** Recupera todas las condiciones contractuales asociadas a un cliente específico.

**Ejemplo:**

```
GET /api/contractual_conditions/client-name/1
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
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Crea una nueva condición contractual para un cliente.

**Request Body:**

```json
{
  "clientId": 1,
  "tipo_de_contrato": "Permanente",
  "fecha_inicio": "2025-01-01T00:00:00.000Z",
  "fecha_fin": "2025-12-31T00:00:00.000Z",
  "condiciones_especificas": "Incluye servicio de limpieza semanal sin costo adicional",
  "tarifa": 2500,
  "periodicidad": "Mensual",
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
| periodicidad            | string (enum)      | Sí        | "Diaria", "Semanal", "Mensual" o "Anual"                       |
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
  "estado": "Activo"
}
```

### 5. Modificar una Condición Contractual

**Endpoint:** `PUT /api/contractual_conditions/modify/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
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

| Periodicidad | Descripción                |
| ------------ | -------------------------- |
| Diaria       | Tarifa aplicada por día    |
| Semanal      | Tarifa aplicada por semana |
| Mensual      | Tarifa aplicada por mes    |
| Anual        | Tarifa aplicada por año    |

### Estados de Contrato

| Estado    | Descripción                       |
| --------- | --------------------------------- |
| Activo    | Contrato vigente y operativo      |
| Inactivo  | Contrato temporalmente suspendido |
| Terminado | Contrato finalizado o cancelado   |

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
   GET /api/contractual_conditions/client-name/3
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
