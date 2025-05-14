# Documentación del Portal de Clientes (MVA Backend)

## Índice

1. Introducción
2. Endpoints del Portal de Clientes
   - 1. Gestión de Reclamos (Claims)
   - 2. Encuestas de Satisfacción (Satisfaction Surveys)
   - 3. Solicitudes de Servicio (Ask for Service)
   - 4. Estadísticas del Portal
3. Estructura de Datos
4. Integración con Otros Módulos
5. Notificaciones por Email
6. Ejemplos de Uso
7. Manejo de Errores

## 1. Introducción

El Portal de Clientes proporciona una interfaz dedicada para que los clientes de MVA puedan enviar encuestas de satisfacción, registrar reclamos y solicitar nuevos servicios. Adicionalmente, permite a los administradores y supervisores gestionar y dar seguimiento a estas interacciones. Esta documentación describe los endpoints disponibles, la estructura de datos y los flujos de trabajo principales.

## 2. Endpoints del Portal de Clientes

### 1. Gestión de Reclamos (Claims)

#### Crear un Reclamo

**Endpoint:** `POST /api/clients_portal/claims`  
**Roles permitidos:** Público (no requiere autenticación)  
**Descripción:** Permite a un cliente crear un nuevo reclamo.

**Request Body:**

```json
{
  "cliente": "Constructora ABC",
  "titulo": "Baño químico en mal estado",
  "descripcion": "El baño químico ubicado en la zona norte de la obra presenta pérdidas desde hace tres días.",
  "tipoReclamo": "MANTENIMIENTO",
  "prioridad": "ALTA",
  "fechaIncidente": "2025-05-05T10:00:00.000Z",
  "adjuntoUrls": ["https://storage.example.com/images/foto1.jpg"],
  "esUrgente": true,
  "requiereCompensacion": false
}
```

| Campo                | Tipo     | Requerido | Descripción                                    | Validación                      |
| -------------------- | -------- | --------- | ---------------------------------------------- | ------------------------------- |
| cliente              | string   | Sí        | Nombre del cliente                             | Entre 1 y 255 caracteres        |
| titulo               | string   | Sí        | Título del reclamo                             | Entre 5 y 150 caracteres        |
| descripcion          | string   | Sí        | Descripción detallada del problema             | Sin límite específico           |
| tipoReclamo          | enum     | No        | Tipo de reclamo (default: OTROS)               | Valor del enum TipoReclamo      |
| prioridad            | enum     | No        | Prioridad del reclamo (default: MEDIA)         | Valor del enum PrioridadReclamo |
| fechaIncidente       | string   | Sí        | Fecha y hora en que ocurrió el incidente       | Formato ISO 8601                |
| adjuntoUrls          | string[] | No        | URLs de imágenes o documentos adjuntos         | Array de strings                |
| esUrgente            | boolean  | No        | Indica si el reclamo requiere atención urgente | Boolean (default: false)        |
| requiereCompensacion | boolean  | No        | Indica si el cliente solicita compensación     | Boolean (default: false)        |
| compensacionDetalles | string   | No        | Detalles de la compensación solicitada         | String                          |
| notasinternas        | string   | No        | Notas internas (solo visibles para MVA)        | String                          |

**Respuesta Exitosa (201 Created):**

```json
{
  "reclamo_id": 56,
  "cliente": "Constructora ABC",
  "titulo": "Baño químico en mal estado",
  "descripcion": "El baño químico ubicado en la zona norte de la obra presenta pérdidas desde hace tres días.",
  "tipoReclamo": "MANTENIMIENTO",
  "prioridad": "ALTA",
  "fechaIncidente": "2025-05-05T10:00:00.000Z",
  "adjuntoUrls": ["https://storage.example.com/images/foto1.jpg"],
  "esUrgente": true,
  "requiereCompensacion": false,
  "estado": "PENDIENTE"
}
```

#### Obtener Todos los Reclamos

**Endpoint:** `GET /api/clients_portal/claims`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Recupera todos los reclamos registrados en el sistema.

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "reclamo_id": 56,
    "cliente": "Constructora ABC",
    "titulo": "Baño químico en mal estado",
    "tipoReclamo": "MANTENIMIENTO",
    "prioridad": "ALTA",
    "fechaIncidente": "2025-05-05T10:00:00.000Z",
    "esUrgente": true,
    "estado": "PENDIENTE"
  },
  {
    "reclamo_id": 55,
    "cliente": "Eventos del Sur",
    "titulo": "Entrega de baños con retraso",
    "tipoReclamo": "LOGISTICA",
    "prioridad": "MEDIA",
    "fechaIncidente": "2025-05-03T08:00:00.000Z",
    "esUrgente": false,
    "estado": "EN_PROCESO"
  }
]
```

#### Obtener un Reclamo Específico

**Endpoint:** `GET /api/clients_portal/claims/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Recupera la información detallada de un reclamo específico.

**Ejemplo:**

```
GET /api/clients_portal/claims/56
```

**Respuesta Exitosa (200 OK):**

```json
{
  "reclamo_id": 56,
  "cliente": "Constructora ABC",
  "titulo": "Baño químico en mal estado",
  "descripcion": "El baño químico ubicado en la zona norte de la obra presenta pérdidas desde hace tres días.",
  "tipoReclamo": "MANTENIMIENTO",
  "prioridad": "ALTA",
  "fechaIncidente": "2025-05-05T10:00:00.000Z",
  "adjuntoUrls": ["https://storage.example.com/images/foto1.jpg"],
  "esUrgente": true,
  "requiereCompensacion": false,
  "estado": "PENDIENTE",
  "notasinternas": "Programar revisión inmediata del baño con código BQ-2023-045."
}
```

#### Actualizar un Reclamo

**Endpoint:** `PUT /api/clients_portal/claims/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza la información de un reclamo existente.

**Ejemplo:**

```http
PUT /api/clients_portal/claims/56
Content-Type: application/json

{
  "estado": "EN_PROCESO",
  "notasinternas": "Se ha programado mantenimiento para el 08/05/2025. Técnico asignado: Juan Pérez."
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "reclamo_id": 56,
  "cliente": "Constructora ABC",
  "titulo": "Baño químico en mal estado",
  "descripcion": "El baño químico ubicado en la zona norte de la obra presenta pérdidas desde hace tres días.",
  "tipoReclamo": "MANTENIMIENTO",
  "prioridad": "ALTA",
  "fechaIncidente": "2025-05-05T10:00:00.000Z",
  "adjuntoUrls": ["https://storage.example.com/images/foto1.jpg"],
  "esUrgente": true,
  "requiereCompensacion": false,
  "estado": "EN_PROCESO",
  "notasinternas": "Se ha programado mantenimiento para el 08/05/2025. Técnico asignado: Juan Pérez."
}
```

### 2. Encuestas de Satisfacción (Satisfaction Surveys)

#### Crear una Encuesta de Satisfacción

**Endpoint:** `POST /api/clients_portal/satisfaction_surveys`  
**Roles permitidos:** Público (no requiere autenticación)  
**Descripción:** Permite a un cliente enviar una encuesta de satisfacción sobre un servicio recibido.

**Request Body:**

```json
{
  "cliente": "Constructora ABC",
  "fecha_mantenimiento": "2025-05-03T09:00:00.000Z",
  "calificacion": 4,
  "comentario": "El servicio fue bueno pero el personal llegó 15 minutos tarde.",
  "asunto": "Mantenimiento de baños químicos",
  "aspecto_evaluado": "Puntualidad"
}
```

| Campo               | Tipo   | Requerido | Descripción                              | Validación   |
| ------------------- | ------ | --------- | ---------------------------------------- | ------------ |
| cliente             | string | Sí        | Nombre del cliente                       | No vacío     |
| fecha_mantenimiento | date   | Sí        | Fecha del servicio evaluado              | Fecha válida |
| calificacion        | number | Sí        | Puntuación del 1 al 5                    | Entre 1 y 5  |
| comentario          | string | No        | Comentarios adicionales del cliente      | String       |
| asunto              | string | No        | Asunto o tipo de servicio evaluado       | String       |
| aspecto_evaluado    | string | No        | Aspecto específico que se está evaluando | String       |

**Respuesta Exitosa (201 Created):**

```json
{
  "encuesta_id": 123,
  "cliente": "Constructora ABC",
  "fecha_mantenimiento": "2025-05-03T09:00:00.000Z",
  "calificacion": 4,
  "comentario": "El servicio fue bueno pero el personal llegó 15 minutos tarde.",
  "asunto": "Mantenimiento de baños químicos",
  "aspecto_evaluado": "Puntualidad"
}
```

#### Obtener Todas las Encuestas de Satisfacción

**Endpoint:** `GET /api/clients_portal/satisfaction_surveys`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Recupera todas las encuestas de satisfacción registradas en el sistema.

**Respuesta Exitosa (200 OK):**

```json
[
  {
    "encuesta_id": 123,
    "cliente": "Constructora ABC",
    "fecha_mantenimiento": "2025-05-03T09:00:00.000Z",
    "calificacion": 4,
    "comentario": "El servicio fue bueno pero el personal llegó 15 minutos tarde.",
    "asunto": "Mantenimiento de baños químicos",
    "aspecto_evaluado": "Puntualidad"
  },
  {
    "encuesta_id": 122,
    "cliente": "Eventos del Sur",
    "fecha_mantenimiento": "2025-05-02T10:00:00.000Z",
    "calificacion": 5,
    "comentario": "Excelente servicio, todo en perfecto estado.",
    "asunto": "Instalación de baños para evento",
    "aspecto_evaluado": "Calidad del servicio"
  }
]
```

#### Obtener una Encuesta de Satisfacción Específica

**Endpoint:** `GET /api/clients_portal/satisfaction_surveys/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Recupera la información detallada de una encuesta de satisfacción específica.

**Ejemplo:**

```
GET /api/clients_portal/satisfaction_surveys/123
```

**Respuesta Exitosa (200 OK):**

```json
{
  "encuesta_id": 123,
  "cliente": "Constructora ABC",
  "fecha_mantenimiento": "2025-05-03T09:00:00.000Z",
  "calificacion": 4,
  "comentario": "El servicio fue bueno pero el personal llegó 15 minutos tarde.",
  "asunto": "Mantenimiento de baños químicos",
  "aspecto_evaluado": "Puntualidad"
}
```

#### Actualizar una Encuesta de Satisfacción

**Endpoint:** `PUT /api/clients_portal/satisfaction_surveys/{id}`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Actualiza la información de una encuesta de satisfacción existente.

**Ejemplo:**

```http
PUT /api/clients_portal/satisfaction_surveys/123
Content-Type: application/json

{
  "comentario": "El servicio fue bueno pero el personal llegó 15 minutos tarde. [Nota: Se habló con el cliente y se compensará con un descuento en el próximo servicio]"
}
```

**Respuesta Exitosa (200 OK):**

```json
{
  "encuesta_id": 123,
  "cliente": "Constructora ABC",
  "fecha_mantenimiento": "2025-05-03T09:00:00.000Z",
  "calificacion": 4,
  "comentario": "El servicio fue bueno pero el personal llegó 15 minutos tarde. [Nota: Se habló con el cliente y se compensará con un descuento en el próximo servicio]",
  "asunto": "Mantenimiento de baños químicos",
  "aspecto_evaluado": "Puntualidad"
}
```

### 3. Solicitudes de Servicio (Ask for Service)

#### Crear una Solicitud de Servicio

**Endpoint:** `POST /api/clients_portal/ask_for_service`  
**Roles permitidos:** Público (no requiere autenticación)  
**Descripción:** Permite a clientes potenciales o existentes solicitar información o cotización para un nuevo servicio.

**Request Body:**

```json
{
  "nombrePersona": "Carlos Rodríguez",
  "rolPersona": "Gerente de Operaciones",
  "email": "carlos.rodriguez@empresa.com",
  "telefono": "011-4567-8901",
  "nombreEmpresa": "Construcciones Modernas S.A.",
  "cuit": "30-71234567-8",
  "rubroEmpresa": "Construcción",
  "zonaDireccion": "Av. Rivadavia 1234, CABA",
  "cantidadBaños": "5-10",
  "tipoEvento": "Obra en construcción",
  "duracionAlquiler": "6 meses",
  "startDate": "2025-06-01T00:00:00.000Z",
  "comentarios": "Necesitamos baños químicos para una obra que comenzará en junio. Requerimos opciones con lavamanos."
}
```

| Campo            | Tipo   | Requerido | Descripción                                    | Validación                 |
| ---------------- | ------ | --------- | ---------------------------------------------- | -------------------------- |
| nombrePersona    | string | Sí        | Nombre completo de la persona de contacto      | No vacío                   |
| rolPersona       | string | No        | Cargo o rol en la empresa                      | String                     |
| email            | string | Sí        | Email de contacto                              | Email válido               |
| telefono         | string | Sí        | Teléfono de contacto                           | No vacío                   |
| nombreEmpresa    | string | Sí        | Nombre de la empresa                           | No vacío                   |
| cuit             | string | No        | CUIT de la empresa                             | String                     |
| rubroEmpresa     | string | No        | Rubro o industria de la empresa                | String                     |
| zonaDireccion    | string | Sí        | Zona o dirección donde se requiere el servicio | No vacío                   |
| cantidadBaños    | enum   | No        | Cantidad aproximada de baños requeridos        | Enum: "1-5", "5-10", "+10" |
| tipoEvento       | string | No        | Tipo de evento o proyecto                      | String                     |
| duracionAlquiler | string | No        | Duración estimada del alquiler                 | String                     |
| startDate        | string | No        | Fecha de inicio deseada                        | Formato ISO 8601           |
| comentarios      | string | No        | Comentarios o requisitos adicionales           | String                     |

**Respuesta Exitosa (200 OK):**

```json
{
  "message": "Service request received successfully",
  "data": {
    "nombrePersona": "Carlos Rodríguez",
    "rolPersona": "Gerente de Operaciones",
    "email": "carlos.rodriguez@empresa.com",
    "telefono": "011-4567-8901",
    "nombreEmpresa": "Construcciones Modernas S.A.",
    "cuit": "30-71234567-8",
    "rubroEmpresa": "Construcción",
    "zonaDireccion": "Av. Rivadavia 1234, CABA",
    "cantidadBaños": "5-10",
    "tipoEvento": "Obra en construcción",
    "duracionAlquiler": "6 meses",
    "startDate": "2025-06-01T00:00:00.000Z",
    "comentarios": "Necesitamos baños químicos para una obra que comenzará en junio. Requerimos opciones con lavamanos."
  }
}
```

**Nota**: Los datos del formulario se devuelven en la respuesta para que puedan ser interceptados por el MailerInterceptor que enviará una notificación por correo electrónico.

### 4. Estadísticas del Portal

**Endpoint:** `GET /api/clients_portal/stats`  
**Roles permitidos:** ADMIN, SUPERVISOR  
**Descripción:** Proporciona estadísticas básicas sobre reclamos y encuestas de satisfacción.

**Respuesta Exitosa (200 OK):**

```json
{
  "totalSurveys": 123,
  "totalClaims": 56,
  "surveys": [
    {
      "encuesta_id": 123,
      "cliente": "Constructora ABC",
      "fecha_mantenimiento": "2025-05-03T09:00:00.000Z",
      "calificacion": 4,
      "comentario": "El servicio fue bueno pero el personal llegó 15 minutos tarde.",
      "asunto": "Mantenimiento de baños químicos",
      "aspecto_evaluado": "Puntualidad"
    }
    // Más encuestas...
  ],
  "claims": [
    {
      "reclamo_id": 56,
      "cliente": "Constructora ABC",
      "titulo": "Baño químico en mal estado",
      "tipoReclamo": "MANTENIMIENTO",
      "prioridad": "ALTA",
      "fechaIncidente": "2025-05-05T10:00:00.000Z",
      "esUrgente": true,
      "estado": "PENDIENTE"
    }
    // Más reclamos...
  ]
}
```

## 3. Estructura de Datos

### Reclamo (Claim)

| Campo                | Tipo     | Descripción                                                 |
| -------------------- | -------- | ----------------------------------------------------------- |
| reclamo_id           | number   | Identificador único del reclamo                             |
| cliente              | string   | Nombre del cliente                                          |
| titulo               | string   | Título descriptivo del reclamo                              |
| descripcion          | string   | Descripción detallada del problema                          |
| tipoReclamo          | enum     | Tipo de reclamo (MANTENIMIENTO, LOGISTICA, SERVICIO, OTROS) |
| prioridad            | enum     | Prioridad (ALTA, MEDIA, BAJA)                               |
| fechaIncidente       | Date     | Fecha y hora en que ocurrió el incidente                    |
| adjuntoUrls          | string[] | URLs de imágenes o documentos adjuntos                      |
| esUrgente            | boolean  | Indica si el reclamo requiere atención urgente              |
| requiereCompensacion | boolean  | Indica si el cliente solicita compensación                  |
| compensacionDetalles | string   | Detalles de la compensación solicitada                      |
| estado               | enum     | Estado actual (PENDIENTE, EN_PROCESO, RESUELTO, CANCELADO)  |
| fechaCreacion        | Date     | Fecha de creación del reclamo                               |
| fechaActualizacion   | Date     | Fecha de última actualización                               |
| fechaResolucion      | Date     | Fecha en que se resolvió el reclamo                         |
| resolucionDetalles   | string   | Detalles de la resolución aplicada                          |
| notasinternas        | string   | Notas internas (solo visibles para MVA)                     |

### Encuesta de Satisfacción (Satisfaction Survey)

| Campo               | Tipo   | Descripción                              |
| ------------------- | ------ | ---------------------------------------- |
| encuesta_id         | number | Identificador único de la encuesta       |
| cliente             | string | Nombre del cliente                       |
| fecha_mantenimiento | Date   | Fecha del servicio evaluado              |
| calificacion        | number | Puntuación del 1 al 5                    |
| comentario          | string | Comentarios adicionales del cliente      |
| asunto              | string | Asunto o tipo de servicio evaluado       |
| aspecto_evaluado    | string | Aspecto específico que se está evaluando |
| fechaCreacion       | Date   | Fecha de creación de la encuesta         |
| fechaActualizacion  | Date   | Fecha de última actualización            |

### Solicitud de Servicio (Ask for Service)

| Campo            | Tipo   | Descripción                                                        |
| ---------------- | ------ | ------------------------------------------------------------------ |
| id               | number | Identificador único de la solicitud                                |
| nombrePersona    | string | Nombre completo de la persona de contacto                          |
| rolPersona       | string | Cargo o rol en la empresa                                          |
| email            | string | Email de contacto                                                  |
| telefono         | string | Teléfono de contacto                                               |
| nombreEmpresa    | string | Nombre de la empresa                                               |
| cuit             | string | CUIT de la empresa                                                 |
| rubroEmpresa     | string | Rubro o industria de la empresa                                    |
| zonaDireccion    | string | Zona o dirección donde se requiere el servicio                     |
| cantidadBaños    | enum   | Cantidad aproximada de baños (CHICO, MEDIANO, GRANDE)              |
| tipoEvento       | string | Tipo de evento o proyecto                                          |
| duracionAlquiler | string | Duración estimada del alquiler                                     |
| startDate        | Date   | Fecha de inicio deseada                                            |
| comentarios      | string | Comentarios o requisitos adicionales                               |
| fechaCreacion    | Date   | Fecha de creación de la solicitud                                  |
| estado           | enum   | Estado de la solicitud (NUEVA, CONTACTADA, CONVERTIDA, DESCARTADA) |
| notas            | string | Notas internas sobre el seguimiento                                |

## 4. Integración con Otros Módulos

### Integración con el Módulo de Servicios

Cuando se recibe una solicitud de servicio, el sistema puede:

1. Notificar automáticamente al equipo comercial
2. Crear una oportunidad en el sistema CRM (si está integrado)
3. Programar un seguimiento para contactar al cliente

### Integración con el Módulo de Chemical Toilets

Los reclamos relacionados con mantenimiento de baños químicos pueden:

1. Vincularse automáticamente con los baños químicos afectados
2. Generar alertas para servicios de mantenimiento prioritarios
3. Actualizar el historial de mantenimiento de los baños

## 5. Notificaciones por Email

El sistema envía notificaciones automáticas por email en los siguientes casos:

1. **Confirmación de reclamo recibido:**

   - Al cliente, confirmando que su reclamo ha sido registrado
   - Al equipo interno, alertando sobre un nuevo reclamo

2. **Actualización de estado de reclamo:**

   - Al cliente, informando cambios en el estado de su reclamo

3. **Confirmación de encuesta de satisfacción:**

   - Al cliente, agradeciendo por su retroalimentación

4. **Alerta de reclamos urgentes:**

   - Al equipo de gestión, notificando reclamos marcados como urgentes

5. **Confirmación de solicitud de servicio:**
   - Al cliente potencial, confirmando la recepción de su solicitud
   - Al equipo comercial, alertando sobre nueva solicitud de servicio

## 6. Ejemplos de Uso

### Flujo de Gestión de Reclamos

1. **El cliente registra un reclamo sobre un baño químico defectuoso**

```http
POST /api/clients_portal/claims
Content-Type: application/json

{
  "cliente": "Constructora ABC",
  "titulo": "Baño químico con puerta dañada",
  "descripcion": "La puerta del baño químico ubicado en sector B no cierra correctamente, lo que afecta la privacidad de los usuarios.",
  "tipoReclamo": "MANTENIMIENTO",
  "prioridad": "ALTA",
  "fechaIncidente": "2025-05-06T08:00:00.000Z",
  "esUrgente": true
}
```

2. **El sistema envía una confirmación automática por email**

3. **Un supervisor revisa el reclamo y lo asigna para atención**

```http
PUT /api/clients_portal/claims/58
Content-Type: application/json

{
  "estado": "EN_PROCESO",
  "notasinternas": "Asignado a equipo técnico para revisión mañana 08/05/2025 a primera hora."
}
```

4. **Después de reparar el baño, el supervisor actualiza el reclamo a resuelto**

```http
PUT /api/clients_portal/claims/58
Content-Type: application/json

{
  "estado": "RESUELTO",
  "resolucionDetalles": "Se reparó el mecanismo de cierre de la puerta y se verificó su correcto funcionamiento.",
  "fechaResolucion": "2025-05-08T10:30:00.000Z"
}
```

### Análisis de Encuestas de Satisfacción

1. **El equipo de calidad revisa las encuestas recientes**

```
GET /api/clients_portal/satisfaction_surveys
```

2. **Analiza las tendencias de calificaciones por aspecto**

```
GET /api/clients_portal/stats
```

3. **Identifica áreas de mejora basadas en los comentarios de los clientes**

## 7. Manejo de Errores

### Error de validación

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Error creating claim",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Reclamo o encuesta no encontrado

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Claim not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Encuesta no encontrada

**Respuesta de Error (400 Bad Request):**

```json
{
  "message": "Survey not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error interno del servidor

**Respuesta de Error (500 Internal Server Error):**

```json
{
  "message": "Error retrieving satisfaction surveys",
  "error": "Internal Server Error",
  "statusCode": 500
}
```
