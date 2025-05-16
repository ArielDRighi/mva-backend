# Documentación del Módulo de Correo Electrónico (MVA Backend)

## Índice

1. Introducción
2. Configuración
3. Servicios disponibles
   - 1. Envío de Asignación de Ruta
   - 2. Envío de Modificación de Ruta
   - 3. Notificación de Tarea en Progreso
   - 4. Notificación de Tarea Completada
   - 5. Notificación de Reclamo
   - 6. Notificación de Encuesta de Satisfacción
   - 7. Notificación de Solicitud de Servicio
   - 8. Recuperación de Contraseña
   - 9. Confirmación de Cambio de Contraseña
   - 10. Solicitud de Adelanto Salarial
   - 11. Respuesta a Solicitud de Adelanto Salarial
   - 12. Alerta de Licencias por Vencer
4. Utilidades
5. Modelos de Datos
6. Integración con Otros Módulos
7. Ejemplos de Uso

## Introducción

El módulo de correo electrónico (Mailer) proporciona funcionalidades para enviar notificaciones por correo electrónico a diferentes actores del sistema, como empleados, supervisores y administradores. Permite comunicar eventos importantes como asignaciones de trabajo, completitud de tareas, reclamos de clientes, alertas de vencimiento de licencias y más.

Este módulo es un componente crítico para la comunicación efectiva dentro del sistema MVA Backend, asegurando que todos los usuarios estén informados de cambios relevantes y eventos que requieren su atención.

## Configuración

### Variables de Entorno Requeridas

El módulo de correo utiliza las siguientes variables de entorno:

| Variable   | Descripción                                             | Ejemplo               |
| ---------- | ------------------------------------------------------- | --------------------- |
| EMAIL_USER | Dirección de correo electrónico para enviar mensajes    | notificacion@mva.com  |
| EMAIL_PASS | Contraseña o token de aplicación para la autenticación  | tu_contraseña_segura  |
| FRONT_URL  | URL de la interfaz de usuario (para enlaces en correos) | http://localhost:3000 |

### Configuración del Transporte

El módulo utiliza SMTP para enviar correos a través de Gmail:

```typescript
this.transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});
```

## Servicios Disponibles

### 1. Envío de Asignación de Ruta

**Función:** `sendRoute`

**Descripción:** Envía una notificación por correo electrónico a un empleado cuando se le asigna una nueva ruta de trabajo.

**Parámetros:**

- `email`: Correo del empleado.
- `name`: Nombre del empleado.
- `vehicle`: Vehículo asignado.
- `toilets`: Lista de baños a trasladar o mantener.
- `clients`: Lista de clientes a visitar.
- `serviceType`: Tipo de servicio.
- `taskDate`: Fecha de la tarea.
- `serviceId`: ID del servicio (opcional).
- `assignedEmployees`: Lista de empleados asignados (opcional).
- `clientAddress`: Dirección del cliente (opcional).
- `serviceStartDate`: Fecha de inicio del servicio (opcional).

**Ejemplo de Uso:**

```typescript
await mailerService.sendRoute(
  'empleado@example.com',
  'Juan Pérez',
  'Camión A-123',
  ['Baño #101', 'Baño #102'],
  ['Cliente ABC'],
  'INSTALACIÓN',
  '2025-05-10',
  123,
  ['Juan Pérez', 'María Gómez'],
  'Av. Principal 123',
  '2025-05-10',
);
```

### 2. Envío de Modificación de Ruta

**Función:** `sendRouteModified`

**Descripción:** Notifica a un empleado cuando su ruta asignada ha sido modificada.

**Parámetros:**

- `email`: Correo del empleado.
- `name`: Nombre del empleado.
- `vehicle`: Vehículo asignado.
- `toilets`: Lista de baños a trasladar o mantener.
- `clients`: Lista de clientes a visitar.
- `serviceType`: Tipo de servicio.
- `taskDate`: Fecha de la tarea.
- `clientAddress`: Dirección del cliente (opcional).
- `serviceStartDate`: Fecha de inicio del servicio (opcional).

**Ejemplo de Uso:**

```typescript
await mailerService.sendRouteModified(
  'empleado@example.com',
  'Juan Pérez',
  'Camión B-456',
  ['Baño #103', 'Baño #104'],
  ['Cliente XYZ'],
  'MANTENIMIENTO',
  '2025-05-12',
  'Calle Nueva 456',
  '2025-05-12',
);
```

### 3. Notificación de Tarea en Progreso

**Función:** `sendInProgressNotification`

**Descripción:** Envía una notificación a administradores y supervisores cuando un empleado comienza un trabajo asignado.

**Parámetros:**

- `adminsEmails`: Lista de correos de administradores.
- `supervisorsEmails`: Lista de correos de supervisores.
- `employeeName`: Nombre del empleado que inició la tarea.
- `taskDetails`: Detalles de la tarea en progreso.

**Ejemplo de Uso:**

```typescript
await mailerService.sendInProgressNotification(
  ['admin@example.com'],
  ['supervisor@example.com'],
  'Juan Pérez',
  {
    client: 'Cliente ABC',
    vehicle: 'Camión A-123',
    serviceType: 'INSTALACIÓN',
    toilets: ['Baño #101', 'Baño #102'],
    taskDate: '2025-05-10',
    serviceId: 123,
  },
);
```

### 4. Notificación de Tarea Completada

**Función:** `sendCompletionNotification`

**Descripción:** Notifica a administradores y supervisores cuando un empleado ha completado un trabajo asignado.

**Parámetros:**

- `adminsEmails`: Lista de correos de administradores.
- `supervisorsEmails`: Lista de correos de supervisores.
- `employeeName`: Nombre del empleado que completó la tarea.
- `taskDetails`: Detalles de la tarea completada.

**Ejemplo de Uso:**

```typescript
await mailerService.sendCompletionNotification(
  ['admin@example.com'],
  ['supervisor@example.com'],
  'Juan Pérez',
  {
    client: 'Cliente ABC',
    vehicle: 'Camión A-123',
    serviceType: 'INSTALACIÓN',
    toilets: ['Baño #101', 'Baño #102'],
    taskDate: '2025-05-10',
    serviceId: 123,
  },
);
```

### 5. Notificación de Reclamo

**Función:** `sendClaimNotification`

**Descripción:** Envía notificación a administradores y supervisores cuando se recibe un nuevo reclamo de un cliente.

**Parámetros:**

- `adminsEmails`: Lista de correos de administradores.
- `supervisorsEmails`: Lista de correos de supervisores.
- `clientName`: Nombre del cliente que presentó el reclamo.
- `claimTitle`: Título del reclamo.
- `claimDescription`: Descripción detallada del reclamo.
- `claimType`: Tipo de reclamo (categoría).
- `claimDate`: Fecha en que se recibió el reclamo.

**Ejemplo de Uso:**

```typescript
await mailerService.sendClaimNotification(
  ['admin@example.com'],
  ['supervisor@example.com'],
  'Empresa XYZ',
  'Baño no limpiado',
  'El baño no fue limpiado según lo programado',
  'LIMPIEZA',
  '2025-05-07',
);
```

### 6. Notificación de Encuesta de Satisfacción

**Función:** `sendSurveyNotification`

**Descripción:** Notifica a administradores y supervisores cuando un cliente completa una encuesta de satisfacción.

**Parámetros:**

- `adminsEmails`: Lista de correos de administradores.
- `supervisorsEmails`: Lista de correos de supervisores.
- `clientName`: Nombre del cliente que completó la encuesta.
- `maintenanceDate`: Fecha del mantenimiento evaluado.
- `surveyRating`: Calificación numérica asignada (1-5).
- `surveyComments`: Comentarios adicionales del cliente.
- `surveyAsunto`: Asunto o motivo de la encuesta.
- `evaluatedAspects`: Aspectos evaluados en la encuesta.

**Ejemplo de Uso:**

```typescript
await mailerService.sendSurveyNotification(
  ['admin@example.com'],
  ['supervisor@example.com'],
  'Empresa XYZ',
  new Date('2025-05-05'),
  4,
  'Buen servicio, pero llegaron un poco tarde',
  'Evaluación de mantenimiento mensual',
  'Puntualidad, Limpieza, Atención',
);
```

### 7. Notificación de Solicitud de Servicio

**Función:** `sendServiceNotification`

**Descripción:** Notifica a administradores y supervisores cuando se recibe una nueva solicitud de servicio.

**Parámetros:**

- `adminsEmails`: Lista de correos de administradores.
- `supervisorsEmails`: Lista de correos de supervisores.
- `nombrePersona`: Nombre de la persona que solicita el servicio.
- `rolPersona`: Rol o cargo de la persona en la empresa.
- `email`: Correo electrónico de contacto.
- `telefono`: Teléfono de contacto.
- `nombreEmpresa`: Nombre de la empresa solicitante.
- `cuit`: CUIT/RUT de la empresa.
- `rubroEmpresa`: Sector o industria de la empresa.
- `zonaDireccion`: Ubicación donde se requiere el servicio.
- `cantidadBaños`: Cantidad de baños solicitados.
- `tipoEvento`: Tipo de evento o necesidad.
- `duracionAlquiler`: Duración estimada del servicio.
- `comentarios`: Comentarios adicionales del solicitante.

**Ejemplo de Uso:**

```typescript
await mailerService.sendServiceNotification(
  ['admin@example.com'],
  ['supervisor@example.com'],
  'Juan Pérez',
  'Gerente de Obra',
  'juan@empresa.com',
  '123456789',
  'Constructora XYZ',
  '30-12345678-9',
  'Construcción',
  'Zona Norte',
  '5',
  'Obra de construcción',
  '3 meses',
  'Necesitamos baños con lavamanos incluido',
);
```

### 8. Recuperación de Contraseña

**Función:** `sendPasswordResetEmail`

**Descripción:** Envía un correo a un usuario con una nueva contraseña temporal.

**Parámetros:**

- `email`: Correo del usuario.
- `name`: Nombre del usuario.
- `password`: Nueva contraseña temporal generada.

**Ejemplo de Uso:**

```typescript
await mailerService.sendPasswordResetEmail(
  'usuario@example.com',
  'Juan Pérez',
  'Temp123Password!',
);
```

### 9. Confirmación de Cambio de Contraseña

**Función:** `sendPasswordChangeConfirmationEmail`

**Descripción:** Notifica a un usuario que su contraseña ha sido cambiada exitosamente.

**Parámetros:**

- `email`: Correo del usuario.
- `name`: Nombre del usuario.
- `password`: Nueva contraseña configurada.

**Ejemplo de Uso:**

```typescript
await mailerService.sendPasswordChangeConfirmationEmail(
  'usuario@example.com',
  'Juan Pérez',
  'NewSecurePass123!',
);
```

### 10. Solicitud de Adelanto Salarial

**Función:** `sendSalaryAdvanceRequestToAdmins`

**Descripción:** Notifica a los administradores sobre una nueva solicitud de adelanto salarial realizada por un empleado.

**Parámetros:**

- `data`: Objeto con la información de la solicitud:
  - `employee`: Información del empleado (nombre, apellido, email).
  - `amount`: Monto solicitado.
  - `reason`: Motivo de la solicitud.
  - `createdAt`: Fecha de creación de la solicitud.

**Ejemplo de Uso:**

```typescript
await mailerService.sendSalaryAdvanceRequestToAdmins({
  employee: {
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
  },
  amount: 5000,
  reason: 'Gastos médicos imprevistos',
  createdAt: new Date(),
});
```

### 11. Respuesta a Solicitud de Adelanto Salarial

**Función:** `sendSalaryAdvanceResponseToEmployee`

**Descripción:** Notifica a un empleado sobre la respuesta (aprobación o rechazo) a su solicitud de adelanto salarial.

**Parámetros:**

- `data`: Objeto con la información de la respuesta:
  - `employee`: Información del empleado (nombre, email).
  - `status`: Estado de la solicitud ('approved', 'rejected', 'pending').
  - `updatedAt`: Fecha de actualización.
  - `reason`: Motivo de la respuesta (opcional).

**Ejemplo de Uso:**

```typescript
await mailerService.sendSalaryAdvanceResponseToEmployee({
  employee: {
    nombre: 'Juan',
    email: 'juan@example.com',
  },
  status: 'approved',
  updatedAt: new Date(),
});
```

### 12. Alerta de Licencias por Vencer

**Función:** `sendExpiringLicenseAlert`

**Descripción:** Notifica a administradores y supervisores sobre licencias de conducir próximas a vencer.

**Parámetros:**

- `adminsEmails`: Lista de correos de administradores.
- `supervisorsEmails`: Lista de correos de supervisores.
- `licenses`: Lista de licencias próximas a vencer.

**Ejemplo de Uso:**

```typescript
await mailerService.sendExpiringLicenseAlert(
  ['admin@example.com'],
  ['supervisor@example.com'],
  [
    /* Lista de objetos Licencias */
  ],
);
```

## Utilidades

### Funciones Auxiliares

El módulo incluye funciones auxiliares para:

1. **Obtener correos de administradores**:

   ```typescript
   const adminEmails = await mailerService.getAdminEmails();
   ```

2. **Obtener correos de supervisores**:

   ```typescript
   const supervisorEmails = await mailerService.getSupervisorEmails();
   ```

3. **Generar contenido HTML para correos**:
   ```typescript
   const htmlContent = mailerService.generateEmailContent('Título', 'Cuerpo');
   ```

## Modelos de Datos

### Interface MailOptions

```typescript
interface MailOptions {
  from: string; // Remitente
  to: string | string[]; // Destinatario(s)
  subject: string; // Asunto
  html: string; // Contenido HTML
}
```

### Interface TaskDetails

```typescript
interface TaskDetails {
  client: string; // Nombre del cliente
  vehicle: string; // Vehículo asignado
  serviceType: string; // Tipo de servicio
  toilets: string[]; // Lista de baños
  taskDate: string; // Fecha de la tarea
  employees?: string; // Lista de empleados (opcional)
  serviceId?: number; // ID del servicio (opcional)
}
```

## Integración con Otros Módulos

El módulo de correo electrónico se integra con:

1. **Módulo de Usuarios**: Para obtener correos de administradores y supervisores.
2. **Módulo de Empleados**: Para notificaciones relacionadas con licencias y adelantos salariales.
3. **Módulo de Servicios**: Para notificaciones sobre asignaciones y modificaciones de rutas.
4. **Módulo de Autenticación**: Para correos de recuperación y cambio de contraseña.
5. **Portal de Clientes**: Para notificaciones sobre encuestas y reclamos.

## Ejemplos de Uso

### Envío de notificación a empleado sobre nueva asignación

```typescript
// En un controlador o servicio que gestiona asignaciones
async function asignarRutaAEmpleado(empleadoId: number, servicioId: number) {
  // Obtener datos necesarios...

  // Enviar notificación por correo
  await this.mailerService.sendRoute(
    empleado.email,
    `${empleado.nombre} ${empleado.apellido}`,
    `${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.patente})`,
    banosAsignados.map((b) => `${b.codigo} - ${b.tipo}`),
    [cliente.nombre],
    servicio.tipo_servicio,
    new Date(servicio.fecha_inicio).toLocaleDateString('es-AR'),
    servicio.id,
    empleadosAsignados.map((e) => `${e.nombre} ${e.apellido}`),
    cliente.direccion,
    servicio.fecha_inicio_contrato,
  );
}
```

### Envío de alerta por licencias próximas a vencer

```typescript
// En un servicio programado que verifica licencias
async function verificarLicenciasPorVencer() {
  // Obtener licencias próximas a vencer (30 días)
  const licencias = await this.licenciasRepository.find({
    where: {
      fecha_vencimiento: Between(
        new Date(),
        new Date(new Date().setDate(new Date().getDate() + 30)),
      ),
    },
    relations: ['empleado'],
  });

  if (licencias.length > 0) {
    // Obtener correos de admins y supervisores
    const adminEmails = await this.mailerService.getAdminEmails();
    const supervisorEmails = await this.mailerService.getSupervisorEmails();

    // Enviar alerta
    await this.mailerService.sendExpiringLicenseAlert(
      adminEmails,
      supervisorEmails,
      licencias,
    );
  }
}
```
