# Documentación del Módulo de Adelantos de Salario (MVA Backend)

## Índice

1. Introducción
2. Estructura de Datos de Adelantos de Salario
3. Endpoints de Adelantos de Salario
   - 1. Solicitar Adelanto de Salario
   - 2. Obtener Todos los Adelantos
   - 3. Aprobar o Rechazar Adelanto
4. Flujo de Adelantos de Salario
5. Ejemplos de Uso
6. Manejo de Errores

## 1. Introducción

El módulo de Adelantos de Salario permite a los empleados solicitar anticipos de su salario y a los administradores gestionar estas solicitudes. Esta documentación describe los endpoints disponibles y la estructura de datos implementada.

## 2. Estructura de Datos de Adelantos de Salario

La entidad `SalaryAdvance` está definida con los siguientes campos:

| Atributo   | Tipo     | Descripción                                               |
| ---------- | -------- | --------------------------------------------------------- |
| id         | number   | Identificador único del adelanto                          |
| employee   | Empleado | Relación con el empleado que solicita el adelanto         |
| amount     | number   | Monto solicitado como adelanto                            |
| reason     | string   | Razón o justificación para solicitar el adelanto          |
| status     | string   | Estado de la solicitud: 'pending', 'approved', 'rejected' |
| createdAt  | Date     | Fecha de creación de la solicitud                         |
| updatedAt  | Date     | Fecha de última actualización de la solicitud             |
| approvedBy | string   | Nombre de quien aprobó/rechazó la solicitud               |
| approvedAt | Date     | Fecha en que se aprobó/rechazó la solicitud               |

## 3. Endpoints de Adelantos de Salario

### 1. Solicitar Adelanto de Salario

**Endpoint:** `POST /salary-advances`  
**Roles permitidos:** Cualquier usuario autenticado (JWT)  
**Descripción:** Permite a un empleado solicitar un adelanto de salario.

**Request Body:**

```json
{
  "amount": 10000,
  "reason": "Gastos médicos imprevistos"
}
```

| Campo  | Tipo   | Requerido | Descripción            | Validación                   |
| ------ | ------ | --------- | ---------------------- | ---------------------------- |
| amount | number | Sí        | Monto solicitado       | Debe ser un número           |
| reason | string | Sí        | Motivo de la solicitud | Debe ser un texto no vacío   |
| status | string | No        | Estado (opcional)      | Valor por defecto: "pending" |

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 15,
  "employee": {
    "id": 32,
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "amount": 10000,
  "reason": "Gastos médicos imprevistos",
  "status": "pending",
  "createdAt": "2025-05-07T15:30:00.000Z",
  "updatedAt": "2025-05-07T15:30:00.000Z"
}
```

### 2. Obtener Todos los Adelantos

**Endpoint:** `GET /salary-advances`  
**Roles permitidos:** Todos los roles autenticados  
**Descripción:** Recupera todas las solicitudes de adelanto de salario.

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 15,
    "employee": {
      "id": 32,
      "nombre": "Juan",
      "apellido": "Pérez"
    },
    "amount": 10000,
    "reason": "Gastos médicos imprevistos",
    "status": "pending",
    "createdAt": "2025-05-07T15:30:00.000Z"
  },
  {
    "id": 14,
    "employee": {
      "id": 28,
      "nombre": "María",
      "apellido": "González"
    },
    "amount": 5000,
    "reason": "Reparación de vehículo",
    "status": "approved",
    "createdAt": "2025-05-05T10:15:00.000Z",
    "approvedBy": "Admin User",
    "approvedAt": "2025-05-06T09:30:00.000Z"
  }
  // Más adelantos...
]
```

### 3. Aprobar o Rechazar Adelanto

**Endpoint:** `PATCH /salary-advances/{id}`  
**Roles permitidos:** ADMIN  
**Descripción:** Aprueba o rechaza una solicitud de adelanto de salario.

**Request Body:**

```json
{
  "status": "approved",
  "comentario": "Aprobado según política de la empresa"
}
```

| Campo      | Tipo   | Requerido | Descripción                           | Validación                       |
| ---------- | ------ | --------- | ------------------------------------- | -------------------------------- |
| status     | string | Sí        | Nuevo estado de la solicitud          | Debe ser 'approved' o 'rejected' |
| comentario | string | No        | Comentario opcional sobre la decisión | -                                |

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 15,
  "employee": {
    "id": 32,
    "nombre": "Juan",
    "apellido": "Pérez"
  },
  "amount": 10000,
  "reason": "Gastos médicos imprevistos",
  "status": "approved",
  "createdAt": "2025-05-07T15:30:00.000Z",
  "updatedAt": "2025-05-08T09:45:00.000Z",
  "approvedBy": "Admin User",
  "approvedAt": "2025-05-08T09:45:00.000Z"
}
```

## 4. Flujo de Adelantos de Salario

El flujo típico de un adelanto de salario es:

1. **Solicitud**: El empleado realiza una solicitud de adelanto indicando el monto y la razón.
2. **Revisión**: Los administradores revisan la solicitud.
3. **Aprobación/Rechazo**: El administrador aprueba o rechaza la solicitud.
4. **Notificación**: El sistema notifica al empleado sobre el estado de su solicitud mediante el interceptor de correo (MailerInterceptor).

## 5. Ejemplos de Uso

### Empleado solicitando un adelanto

```http
POST /salary-advances
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "amount": 15000,
  "reason": "Pago de matrícula escolar"
}
```

### Administrador aprobando una solicitud

```http
PATCH /salary-advances/16
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "status": "approved",
  "comentario": "Aprobado por desempeño excelente"
}
```

### Administrador rechazando una solicitud

```http
PATCH /salary-advances/17
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "status": "rejected",
  "comentario": "Rechazado por superar el límite mensual permitido"
}
```

## 6. Manejo de Errores

### Solicitud no encontrada

**Respuesta de Error (404 Not Found):**

```json
{
  "message": "Advance with id 999 not found",
  "error": "Not Found",
  "statusCode": 404
}
```

### Error al aprobar solicitud

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "status must be one of the following values: approved, rejected",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error de validación en datos de entrada

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": ["La cantidad debe ser un número", "La razón es requerida"],
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

### Usuario no autenticado

**Respuesta de Error (401 Unauthorized):**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```
