# Documentación de la API de Clientes (MVA Backend)

## Índice

1. Introducción
2. Autenticación
3. Endpoints de Clientes
   - 1. Crear un Cliente
   - 2. Obtener Todos los Clientes
   - 3. Obtener un Cliente Específico
   - 4. Actualizar un Cliente
   - 5. Eliminar un Cliente
   - 6. Obtener Contrato Activo de un Cliente
4. Integración con Condiciones Contractuales
5. Integración con Servicios
6. Integración con Baños Químicos Asignados
7. Ejemplos de Uso
   - Flujo Básico de Gestión de Clientes
   - Búsqueda de Clientes Asociados
   - Gestión de Ciclo de Vida Completo
8. Manejo de Errores

## 1. Introducción

La API de Clientes permite gestionar la información de las empresas o entidades que contratan los servicios de baños químicos. Esta documentación describe los endpoints disponibles, los formatos de solicitud y respuesta, y cómo integrar la gestión de clientes con otras funcionalidades del sistema como condiciones contractuales y servicios.

## 2. Autenticación

Todas las solicitudes requieren autenticación mediante token JWT. El token debe incluirse en el encabezado `Authorization`:

```
Authorization: Bearer {tu_token_jwt}
```

Para obtener un token:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "tu_usuario",
  "password": "tu_contraseña"
}
```

## 3. Endpoints de Clientes

### 1. Crear un Cliente

**Endpoint:** `POST /api/clients`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Crea un nuevo cliente en el sistema.

**Request Body:**

```json
{
  "nombre_empresa": "Constructora XYZ",
  "cuit": "30-71234572-5",
  "direccion": "Av. Libertador 1234, Buenos Aires",
  "telefono": "011-5678-9012",
  "email": "contacto@constructoraxyz.com",
  "contacto_principal": "Fernando López"
}
```

| Campo              | Tipo   | Requerido | Descripción                                | Validación               |
| ------------------ | ------ | --------- | ------------------------------------------ | ------------------------ |
| nombre_empresa     | string | Sí        | Nombre de la empresa cliente               | Entre 3 y 100 caracteres |
| cuit               | string | Sí        | Clave Única de Identificación Tributaria   | Formato XX-XXXXXXXX-X    |
| direccion          | string | Sí        | Dirección física de la empresa             | Entre 5 y 200 caracteres |
| telefono           | string | Sí        | Número de teléfono de contacto             | Entre 5 y 20 caracteres  |
| email              | string | Sí        | Email de contacto principal                | Email válido             |
| contacto_principal | string | Sí        | Nombre de la persona de contacto principal | Entre 3 y 100 caracteres |

**Respuesta Exitosa (201 Created):**

```json
{
  "clienteId": 6,
  "nombre": "Constructora XYZ",
  "cuit": "30-71234572-5",
  "direccion": "Av. Libertador 1234, Buenos Aires",
  "telefono": "011-5678-9012",
  "email": "contacto@constructoraxyz.com",
  "contacto_principal": "Fernando López",
  "fecha_registro": "2025-04-21T10:15:30.000Z",
  "estado": "ACTIVO"
}
```

**Respuesta de Error (409 Conflict):**

```json
{
  "message": "Ya existe un cliente con el CUIT 30-71234572-5",
  "error": "Conflict",
  "statusCode": 409
}
```

## 2. Obtener Clientes

**Endpoint: GET /api/clients**
**Roles permitidos: Todos los usuarios autenticados**
**Descripción: Recupera los clientes registrados en el sistema, con soporte para paginación y búsqueda por texto.**

**Parámetros de Query Opcionales:**

| Parámetro | Tipo   | Descripción                                                           |
| --------- | ------ | --------------------------------------------------------------------- |
| search    | string | Búsqueda por texto (nombre, CUIT, email, estado, dirección, contacto) |
| page      | number | Número de página a recuperar (por defecto: 1)                         |
| limit     | number | Cantidad de resultados por página (por defecto: 10)                   |

**Nota sobre búsqueda:** El parámetro `search` permite buscar coincidencias en cualquiera de los siguientes campos: nombre, CUIT, email, estado, dirección o contacto principal. La búsqueda es insensible a mayúsculas/minúsculas, tildes y caracteres especiales.

**Ejemplos:**

GET /api/clients
GET /api/clients?search=constructora
GET /api/clients?search=ACTIVO
GET /api/clients?search=30-71234567-0&page=2&limit=5

**Respuesta Exitosa (200 OK):**

```json
{
  "items": [
    {
      "clienteId": 1,
      "nombre": "Constructora ABC",
      "cuit": "30-71234567-0",
      "direccion": "Av. Principal 123, Buenos Aires",
      "telefono": "011-4567-8901",
      "email": "contacto@constructoraabc.com",
      "contacto_principal": "Juan Pérez",
      "fecha_registro": "2025-01-15T08:30:00.000Z",
      "estado": "ACTIVO"
    },
    {
      "clienteId": 2,
      "nombre": "Eventos del Sur",
      "cuit": "30-71234568-1",
      "direccion": "Calle Sur 456, Córdoba",
      "telefono": "0351-456-7890",
      "email": "info@eventosdelsur.com",
      "contacto_principal": "María González",
      "fecha_registro": "2025-01-20T09:45:00.000Z",
      "estado": "ACTIVO"
    }
    // Más clientes...
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### 3. Obtener un Cliente Específico

**Endpoint:** `GET /api/clients/{id}`  
**Roles permitidos:** Todos los usuarios autenticados  
**Descripción:** Recupera la información de un cliente específico por su ID.

**Ejemplo:**

```
GET /api/clients/1
```

**Respuesta Exitosa (200 OK):**

```json
{
  "clienteId": 1,
  "nombre": "Constructora ABC",
  "cuit": "30-71234567-0",
  "direccion": "Av. Principal 123, Buenos Aires",
  "telefono": "011-4567-8901",
  "email": "contacto@constructoraabc.com",
  "contacto_principal": "Juan Pérez",
  "fecha_registro": "2025-01-15T08:30:00.000Z",
  "estado": "ACTIVO"
}
```

### 4. Actualizar un Cliente

**Endpoint:** `PUT /api/clients/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza la información de un cliente existente.

**Ejemplo:**

```http
PUT /api/clients/1
Content-Type: application/json

{
  "telefono": "011-9876-5432",
  "email": "nuevoemail@constructoraabc.com",
  "contacto_principal": "Carlos Gómez"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "clienteId": 1,
  "nombre": "Constructora ABC",
  "cuit": "30-71234567-0",
  "direccion": "Av. Principal 123, Buenos Aires",
  "telefono": "011-9876-5432",
  "email": "nuevoemail@constructoraabc.com",
  "contacto_principal": "Carlos Gómez",
  "fecha_registro": "2025-01-15T08:30:00.000Z",
  "estado": "ACTIVO"
}
```

### 5. Eliminar un Cliente

**Endpoint:** `DELETE /api/clients/{id}`  
**Roles permitidos:** ADMIN  
**Descripción:** Elimina un cliente del sistema.

**Nota importante:** El sistema no verifica automáticamente si el cliente tiene contratos activos o servicios asociados. Es responsabilidad del desarrollador verificar esto antes de eliminar un cliente.

**Ejemplo:**

```
DELETE /api/clients/6
```

**Respuesta Exitosa (200 OK):**

No devuelve contenido específico.

### 6. Obtener Contrato Activo de un Cliente

**Endpoint:** `GET /api/clients/{id}/active-contract`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Recupera el contrato activo del cliente junto con los baños actualmente asignados.

**Ejemplo:**

```
GET /api/clients/1/active-contract
```

**Respuesta Exitosa (200 OK):**

```json
{
  "contrato": {
    "condicionContractualId": 3,
    "cliente": {
      "clienteId": 1,
      "nombre": "Constructora ABC",
      "cuit": "30-71234567-0"
    },
    "tipo_de_contrato": "Permanente",
    "fecha_inicio": "2025-01-01T00:00:00.000Z",
    "fecha_fin": "2025-12-31T00:00:00.000Z",
    "condiciones_especificas": "Incluye servicio de limpieza semanal",
    "tarifa": "2800.00",
    "periodicidad": "Mensual",
    "estado": "Activo"
  },
  "banosAsignados": [
    {
      "baño_id": 1,
      "codigo_interno": "BQ-2022-001",
      "modelo": "Premium",
      "fecha_adquisicion": "2023-01-15T00:00:00.000Z",
      "estado": "ASIGNADO"
    },
    {
      "baño_id": 2,
      "codigo_interno": "BQ-2022-002",
      "modelo": "Estándar",
      "fecha_adquisicion": "2023-01-20T00:00:00.000Z",
      "estado": "ASIGNADO"
    }
  ]
}
```

## 4. Integración con Condiciones Contractuales

Los clientes están directamente relacionados con las condiciones contractuales que definen los términos comerciales del servicio:

1. Después de crear un cliente, se puede crear una condición contractual asociada:

```http
POST /api/contractual_conditions/create
Content-Type: application/json

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

2. Para consultar todas las condiciones contractuales de un cliente:

```
GET /api/contractual_conditions/client-name/{clientId}
```

## 5. Integración con Servicios

Los clientes son referenciados en los servicios de baños químicos:

1. Al crear un servicio, se especifica el cliente asociado:

```http
POST /api/services
Content-Type: application/json

{
  "clienteId": 1,
  "fechaProgramada": "2025-05-15T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "asignacionAutomatica": true
}
```

2. Para consultar todos los servicios asociados a un cliente:

```
GET /api/services?clienteId=1
```

## 6. Integración con Baños Químicos Asignados

Para consultar los baños químicos actualmente asignados a un cliente específico:

```
GET /api/chemical_toilets/by-client/{clientId}
```

Esta consulta es particularmente útil para:

- Crear servicios de LIMPIEZA, REEMPLAZO o RETIRO
- Verificar el inventario asignado a un cliente
- Planificar mantenimientos o reemplazos

## 7. Ejemplos de Uso

### Flujo Básico de Gestión de Clientes

1. **Crear un nuevo cliente**

```http
POST /api/clients
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre_empresa": "Centro de Eventos El Prado",
  "cuit": "30-71234573-6",
  "direccion": "Ruta 2 km 50, Buenos Aires",
  "telefono": "011-6789-0123",
  "email": "eventos@elprado.com",
  "contacto_principal": "Lucía Rodríguez"
}
```

2. **Establecer condiciones contractuales**

```http
POST /api/contractual_conditions/create
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clientId": 6,
  "tipo_de_contrato": "Temporal",
  "fecha_inicio": "2025-05-01T00:00:00.000Z",
  "fecha_fin": "2025-05-31T00:00:00.000Z",
  "condiciones_especificas": "Contrato para evento de 3 días",
  "tarifa": 2500,
  "periodicidad": "Total",
  "estado": "Activo"
}
```

3. **Crear servicio de instalación**

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 6,
  "fechaProgramada": "2025-05-01T08:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 5,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "ubicacion": "Ruta 2 km 50, Salón Principal",
  "notas": "Evento de 3 días con 1000 asistentes",
  "asignacionAutomatica": true,
  "condicionContractualId": 5
}
```

### Búsqueda de Clientes Asociados

1. **Buscar todos los clientes activos**

```
GET /api/clients?estado=ACTIVO
Authorization: Bearer {{token}}
```

2. **Verificar el contrato activo de un cliente**

```
GET /api/clients/6/active-contract
Authorization: Bearer {{token}}
```

3. **Consultar los baños asignados a un cliente**

```
GET /api/chemical_toilets/by-client/6
Authorization: Bearer {{token}}
```

### Gestión de Ciclo de Vida Completo

1. **Creación de cliente y contrato**
2. **Instalación de baños**
3. **Servicios de limpieza periódicos**
4. **Modificación de datos de contacto**
5. **Retiro de baños al finalizar contrato**
6. **Inactivación del cliente (si no tiene nuevos contratos)**

## 8. Manejo de Errores

### Cliente no encontrado

**Respuesta de Error (404 Not Found):**

```json
{
  "message": "Client with id 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Error de validación

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": [
    "cuit must match format XX-XXXXXXXX-X",
    "email must be a valid email"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Cliente con CUIT duplicado

**Respuesta de Error (409 Conflict):**

```json
{
  "message": "Ya existe un cliente con el CUIT 30-71234572-5",
  "error": "Conflict",
  "statusCode": 409
}
```

### Contrato activo no encontrado

**Respuesta de Error (404 Not Found):**

```json
{
  "message": "No hay contratos activos para el cliente Constructora XYZ",
  "error": "Not Found",
  "statusCode": 404
}
```
