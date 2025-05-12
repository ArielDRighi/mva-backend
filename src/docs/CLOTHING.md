# Documentación del Módulo de Indumentaria (MVA Backend)

## Índice

1. Introducción
2. Estructura de Datos de Indumentaria
3. Endpoints de Indumentaria
   - 1. Obtener Todas las Tallas
   - 2. Obtener Tallas por Empleado
   - 3. Crear Registro de Tallas
   - 4. Actualizar Tallas de Empleado
   - 5. Eliminar Tallas de Empleado
4. Ejemplos de Uso
5. Manejo de Errores

## 1. Introducción

El módulo de Indumentaria permite gestionar las tallas de ropa y calzado de los empleados de la empresa. Este sistema facilita el registro de las medidas necesarias para la adquisición y asignación de uniformes y equipamiento de trabajo. Esta documentación describe los endpoints disponibles y la estructura de datos implementada.

## 2. Estructura de Datos de Indumentaria

La entidad principal `RopaTalles` está definida con los siguientes campos:

| Atributo                       | Descripción                                    |
| ------------------------------ | ---------------------------------------------- |
| id                             | Identificador único del registro de tallas     |
| empleado                       | Relación con el empleado (One-to-One)          |
| calzado_talle                  | Talla de calzado del empleado                  |
| pantalon_talle                 | Talla de pantalón del empleado                 |
| camisa_talle                   | Talla de camisa del empleado                   |
| campera_bigNort_talle          | Talla de campera BigNort del empleado          |
| pielBigNort_talle              | Talla de piel BigNort del empleado             |
| medias_talle                   | Talla de medias del empleado                   |
| pantalon_termico_bigNort_talle | Talla de pantalón térmico BigNort del empleado |
| campera_polar_bigNort_talle    | Talla de campera polar BigNort del empleado    |
| mameluco_talle                 | Talla de mameluco del empleado                 |
| createdAt                      | Fecha de creación del registro                 |
| updatedAt                      | Fecha de última actualización del registro     |

## 3. Endpoints de Indumentaria

### 1. Obtener Todas las Tallas

**Endpoint:** `GET /api/clothing`  
**Roles permitidos:** ADMIN  
**Descripción:** Obtiene todos los registros de tallas de todos los empleados.

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "id": 25,
    "empleado": {
      "id": 12,
      "nombre": "Juan",
      "apellido": "Gómez"
    },
    "calzado_talle": "42",
    "pantalon_talle": "40",
    "camisa_talle": "M",
    "campera_bigNort_talle": "L",
    "pielBigNort_talle": "L",
    "medias_talle": "40-43",
    "pantalon_termico_bigNort_talle": "40",
    "campera_polar_bigNort_talle": "L",
    "mameluco_talle": "M",
    "createdAt": "2025-05-07T16:30:00.000Z",
    "updatedAt": "2025-05-07T16:30:00.000Z"
  },
  {
    "id": 26,
    "empleado": {
      "id": 14,
      "nombre": "María",
      "apellido": "López"
    },
    "calzado_talle": "38",
    "pantalon_talle": "36",
    "camisa_talle": "S",
    // ...otros campos de tallas...
    "createdAt": "2025-05-07T16:35:00.000Z",
    "updatedAt": "2025-05-07T16:35:00.000Z"
  }
  // ...más registros de tallas...
]
```

### 2. Obtener Tallas por Empleado

**Endpoint:** `GET /api/clothing/:empleadoId`  
**Roles permitidos:** ADMIN, SUPERVISOR, OPERARIO  
**Descripción:** Obtiene las tallas registradas para un empleado específico.

**Ejemplo:**

```
GET /api/clothing/12
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 25,
  "empleado": {
    "id": 12,
    "nombre": "Juan",
    "apellido": "Gómez"
  },
  "calzado_talle": "42",
  "pantalon_talle": "40",
  "camisa_talle": "M",
  "campera_bigNort_talle": "L",
  "pielBigNort_talle": "L",
  "medias_talle": "40-43",
  "pantalon_termico_bigNort_talle": "40",
  "campera_polar_bigNort_talle": "L",
  "mameluco_talle": "M",
  "createdAt": "2025-05-07T16:30:00.000Z",
  "updatedAt": "2025-05-07T16:30:00.000Z"
}
```

### 3. Crear Registro de Tallas

**Endpoint:** `POST /api/clothing/create/:empleadoId`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Crea un nuevo registro de tallas para un empleado específico.

**Request Body:**

```json
{
  "calzado_talle": "42",
  "pantalon_talle": "40",
  "camisa_talle": "M",
  "campera_bigNort_talle": "L",
  "pielBigNort_talle": "L",
  "medias_talle": "40-43",
  "pantalon_termico_bigNort_talle": "40",
  "campera_polar_bigNort_talle": "L",
  "mameluco_talle": "M"
}
```

| Campo                          | Tipo   | Requerido | Descripción                       |
| ------------------------------ | ------ | --------- | --------------------------------- |
| calzado_talle                  | string | No        | Talla de calzado del empleado     |
| pantalon_talle                 | string | No        | Talla de pantalón del empleado    |
| camisa_talle                   | string | No        | Talla de camisa del empleado      |
| campera_bigNort_talle          | string | No        | Talla de campera BigNort          |
| pielBigNort_talle              | string | No        | Talla de piel BigNort             |
| medias_talle                   | string | No        | Talla de medias                   |
| pantalon_termico_bigNort_talle | string | No        | Talla de pantalón térmico BigNort |
| campera_polar_bigNort_talle    | string | No        | Talla de campera polar BigNort    |
| mameluco_talle                 | string | No        | Talla de mameluco                 |

**Ejemplo:**

```
POST /api/clothing/create/12
```

**Respuesta Exitosa (201 Created):**

```json
{
  "id": 25,
  "empleado": {
    "id": 12,
    "nombre": "Juan",
    "apellido": "Gómez"
  },
  "calzado_talle": "42",
  "pantalon_talle": "40",
  "camisa_talle": "M",
  "campera_bigNort_talle": "L",
  "pielBigNort_talle": "L",
  "medias_talle": "40-43",
  "pantalon_termico_bigNort_talle": "40",
  "campera_polar_bigNort_talle": "L",
  "mameluco_talle": "M",
  "createdAt": "2025-05-07T16:30:00.000Z",
  "updatedAt": "2025-05-07T16:30:00.000Z"
}
```

### 4. Actualizar Tallas de Empleado

**Endpoint:** `PUT /api/clothing/modify/:empleadoId`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza el registro de tallas de un empleado específico.

**Request Body:**

```json
{
  "calzado_talle": "43",
  "pantalon_talle": "42"
}
```

**Ejemplo:**

```
PUT /api/clothing/modify/12
```

**Respuesta Exitosa (200 OK):**

```json
{
  "id": 25,
  "empleado": {
    "id": 12,
    "nombre": "Juan",
    "apellido": "Gómez"
  },
  "calzado_talle": "43",
  "pantalon_talle": "42",
  "camisa_talle": "M",
  "campera_bigNort_talle": "L",
  "pielBigNort_talle": "L",
  "medias_talle": "40-43",
  "pantalon_termico_bigNort_talle": "40",
  "campera_polar_bigNort_talle": "L",
  "mameluco_talle": "M",
  "createdAt": "2025-05-07T16:30:00.000Z",
  "updatedAt": "2025-05-08T10:15:00.000Z"
}
```

### 5. Eliminar Tallas de Empleado

**Endpoint:** `DELETE /api/clothing/delete/:empleadoId`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Elimina el registro de tallas de un empleado específico.

**Ejemplo:**

```
DELETE /api/clothing/delete/12
```

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Talles eliminados correctamente"
}
```

## 4. Ejemplos de Uso

### Registro de Tallas para un Nuevo Empleado

```http
POST /api/clothing/create/14
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "calzado_talle": "41",
  "pantalon_talle": "38",
  "camisa_talle": "L",
  "campera_bigNort_talle": "XL",
  "medias_talle": "38-41"
}
```

### Actualización de Tallas por Cambio de Indumentaria

```http
PUT /api/clothing/modify/14
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "camisa_talle": "XL",
  "mameluco_talle": "L"
}
```

### Consulta de Tallas de Todos los Empleados

```http
GET /api/clothing
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Eliminación de Registro de Tallas

```http
DELETE /api/clothing/delete/14
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 5. Manejo de Errores

### Empleado no encontrado

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Empleado no encontrado",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Tallas no encontradas

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Talles no encontrados",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error de validación

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": ["propiedad X debe ser un string"],
  "error": "Bad Request",
  "statusCode": 400
}
```
