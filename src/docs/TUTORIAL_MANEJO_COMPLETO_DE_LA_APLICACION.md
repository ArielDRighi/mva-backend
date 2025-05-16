# Tutorial Completo: MVA Backend - De la Inserción de Datos al Flujo Administrativo

## Índice

1. Preparación del Entorno
2. Población Inicial de la Base de Datos
3. Gestión de Usuarios y Autenticación
   - 3.1 Creación del Usuario Administrador
   - 3.2 Inicio de Sesión y Obtención de Token
   - 3.3 Gestión de Usuarios y Roles
4. Gestión de Recursos
   - 4.1 Gestión de Empleados
   - 4.2 Gestión de Vehículos
   - 4.3 Gestión de Baños Químicos
   - 4.4 Gestión de Ropa de Trabajo
5. Gestión de Mantenimientos
   - 5.1 Mantenimiento de Vehículos
   - 5.2 Mantenimiento de Baños Químicos
6. Gestión de Clientes y Condiciones Contractuales
7. Gestión de Servicios
   - 7.1 Creación de Servicios
   - 7.2 Asignación Manual de Recursos
   - 7.3 Actualización del Estado de un Servicio
   - 7.4 Servicios para Baños Ya Instalados
8. Gestión de Personal
   - 8.1 Licencias de Empleados
   - 8.2 Sistema de Alertas de Licencias
   - 8.3 Solicitudes de Adelanto de Sueldo
9. Portal de Clientes
   - 9.1 Gestión de Reclamos
   - 9.2 Encuestas de Satisfacción
   - 9.3 Solicitudes de Servicio
10. Limpiezas Futuras
    - 10.1 Programación de Limpiezas
    - 10.2 Gestión de Limpiezas Programadas
11. Flujos Administrativos Completos

- 11.1 Flujo de Instalación
- 11.2 Flujo de Mantenimiento Programado
- 11.3 Gestión de Imprevistos
- 11.4 Flujo de Retiro

12. Gestión de Informes
13. Servicio de Programación (Scheduler)
14. Resolución de Problemas Comunes
15. Mejores Prácticas
16. Programación de Agenda Extendida
    - 16.1 Asignación Múltiple de Recursos
    - 16.2 Cómo Utilizar esta Funcionalidad
    - 16.3 Consideraciones Importantes
    - 16.4 Ejemplos Prácticos

## 1. Preparación del Entorno

Antes de comenzar, debemos asegurarnos de que el entorno esté correctamente configurado:

### Configuración del archivo .env

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña
DB_DATABASE=mva_db
DB_SCHEMA=public
JWT_SECRET=tu_secreto_jwt
JWT_EXPIRATION_TIME=8h
```

### Instalación de Dependencias

```bash
# Navegar al directorio del proyecto
cd d:/Personal/mva-backend

# Instalar dependencias
npm install

# Compilar el proyecto
npm run build

# Iniciar la aplicación en modo desarrollo
npm run start:dev
```

## 2. Población Inicial de la Base de Datos

Para arrancar con un conjunto mínimo de datos para pruebas, ejecutaremos el script seed-test-data.ts:

```bash
# Ejecutar script con ts-node
npm run seed:test-data
```

Este script insertará:

- 5 Clientes diferentes
- 5 Empleados con diferentes cargos
- 5 Vehículos con diferentes características
- 10 Baños químicos de varios modelos

### Verificación de Datos Insertados

```bash
# Verificar en la consola el resultado:
Iniciando proceso de inserción de datos de prueba...
Conexión a la base de datos establecida correctamente
Insertando clientes...
Clientes insertados: 5
Insertando empleados...
Empleados insertados: 5
Insertando vehículos...
Vehículos insertados: 5
Insertando baños químicos...
Baños químicos insertados: 10
Total de clientes en la base de datos: 5
Total de empleados en la base de datos: 5
Total de vehículos en la base de datos: 5
Total de baños químicos en la base de datos: 10
¡Datos de prueba insertados correctamente!
```

## 3. Gestión de Usuarios y Autenticación

### 3.1 Creación del Usuario Administrador

Para comenzar a utilizar el sistema, necesitamos crear un usuario administrador inicial:

```bash
# Ejecutar script de creación de usuario administrador
npm run seed:admin
```

El script mostrará un resultado similar a este:

```
Iniciando proceso de creación de usuario administrador...
Conexión a la base de datos establecida correctamente
¡Usuario administrador creado exitosamente!
-------------------------------------
nombre: admin
Password: admin123
Email: admin@mva.com
Roles: ADMIN
ID: 1
-------------------------------------
¡IMPORTANTE! Recuerda cambiar esta contraseña después del primer inicio de sesión.
Conexión a la base de datos cerrada
Script finalizado correctamente
```

### 3.2 Inicio de Sesión y Obtención de Token

Para interactuar con la API, es necesario obtener un token JWT mediante el proceso de autenticación:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

La respuesta incluirá el token de acceso necesario para las solicitudes autenticadas:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nombre": "admin",
    "email": "admin@mva.com",
    "empleadoId": null,
    "estado": "ACTIVO",
    "roles": ["ADMIN"]
  }
}
```

Este token debe incluirse en todas las solicitudes posteriores como encabezado de autorización:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Gestión de Usuarios y Roles

#### Crear un nuevo usuario

```http
POST /api/users
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "supervisor1",
  "email": "supervisor@mva.com",
  "password": "supervisor123",
  "roles": ["SUPERVISOR"],
  "empleadoId": 2
}
```

#### Actualizar un usuario existente

```http
PUT /api/users/2
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "email": "nuevo_email@mva.com",
  "roles": ["SUPERVISOR", "OPERARIO"]
}
```

#### Cambiar estado de un usuario

```http
PATCH /api/users/2/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "INACTIVO"
}
```

#### Ver todos los usuarios

```http
GET /api/users
Authorization: Bearer {{token}}
```

#### Ver un usuario específico

```http
GET /api/users/2
Authorization: Bearer {{token}}
```

## 4. Gestión de Recursos

### 4.1 Gestión de Empleados

#### Crear un nuevo empleado

```http
POST /api/employees
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre": "Roberto",
  "apellido": "Sánchez",
  "documento": "31456789",
  "telefono": "1198765432",
  "email": "roberto.sanchez@example.com",
  "direccion": "Calle Principal 123",
  "fecha_nacimiento": "1988-05-20T00:00:00.000Z",
  "fecha_contratacion": "2024-01-15T00:00:00.000Z",
  "cargo": "Técnico",
  "estado": "DISPONIBLE"
}
```

#### Cambiar el estado de un empleado

```http
PATCH /api/employees/6/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "VACACIONES"
}
```

#### Ver todos los empleados disponibles

```http
GET /api/employees?estado=DISPONIBLE
Authorization: Bearer {{token}}
```

### 4.2 Gestión de Vehículos

#### Crear un nuevo vehículo

```http
POST /api/vehicles
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "placa": "AG678KL",
  "marca": "Renault",
  "modelo": "Kangoo",
  "anio": 2024,
  "capacidadCarga": 800,
  "estado": "DISPONIBLE"
}
```

#### Actualizar información del vehículo

```http
PUT /api/vehicles/6
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "capacidadCarga": 850,
  "descripcion": "Vehículo destinado a transportes menores"
}
```

#### Ver todos los vehículos

```http
GET /api/vehicles
Authorization: Bearer {{token}}
```

### 4.3 Gestión de Baños Químicos

#### Crear un nuevo baño químico

```http
POST /api/chemical_toilets
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "codigo_interno": "BQ-2025-001",
  "modelo": "Ultra Premium",
  "fecha_adquisicion": "2025-01-10T10:00:00.000Z",
  "estado": "DISPONIBLE"
}
```

#### Actualizar un baño químico

```http
PUT /api/chemical_toilets/11
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "modelo": "Ultra Premium Plus",
  "notas": "Baño con mejoras de accesibilidad"
}
```

#### Ver todos los baños disponibles

```http
GET /api/chemical_toilets/search?estado=DISPONIBLE
Authorization: Bearer {{token}}
```

### 4.4 Gestión de Ropa de Trabajo

#### Crear un nuevo registro de ropa de trabajo

```http
POST /api/clothing
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "empleadoId": 1,
  "tipoRopa": "PANTALON",
  "cantidad": 2,
  "fechaEntrega": "2025-05-01T00:00:00.000Z",
  "observaciones": "Pantalones de trabajo talle 42"
}
```

#### Consultar entregas de ropa por empleado

```http
GET /api/clothing/employee/1
Authorization: Bearer {{token}}
```

#### Actualizar un registro de ropa

```http
PUT /api/clothing/5
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "cantidad": 3,
  "observaciones": "Pantalones de trabajo talle 42 - Se agregó uno adicional"
}
```

## 5. Gestión de Mantenimientos

### 5.1 Mantenimiento de Vehículos

#### Programar un mantenimiento futuro

```http
POST /api/vehicle_maintenance
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "vehiculoId": 1,
  "fechaMantenimiento": "2025-06-15T10:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite y filtros",
  "costo": 15000,
  "proximoMantenimiento": "2025-09-15T10:00:00.000Z"
}
```

> **Nota**: Cuando se programa un mantenimiento para una fecha futura, el vehículo permanece en estado "DISPONIBLE" hasta esa fecha.

#### Programar mantenimiento inmediato

```http
POST /api/vehicle_maintenance
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "vehiculoId": 2,
  "fechaMantenimiento": "2025-04-10T10:00:00.000Z",
  "tipoMantenimiento": "Correctivo",
  "descripcion": "Reparación del sistema de frenos",
  "costo": 25000
}
```

> **Nota**: Al programar un mantenimiento para la fecha actual, el estado del vehículo cambia automáticamente a "EN_MANTENIMIENTO".

#### Completar un mantenimiento

```http
PATCH /api/vehicle_maintenance/2/complete
Authorization: Bearer {{token}}
```

> **Nota**: Al completar un mantenimiento, el vehículo vuelve automáticamente a estado "DISPONIBLE".

### 5.2 Mantenimiento de Baños Químicos

#### Programar mantenimiento para un baño

```http
POST /api/toilet_maintenance
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "baño_id": 1,
  "fecha_mantenimiento": "2025-05-20T10:00:00.000Z",
  "tipo_mantenimiento": "Preventivo",
  "descripcion": "Limpieza general y desinfección",
  "tecnico_responsable": "Juan Pérez",
  "costo": 5000
}
```

#### Completar un mantenimiento de baño

```http
PATCH /api/toilet_maintenance/1/complete
Authorization: Bearer {{token}}
```

## 6. Gestión de Clientes y Condiciones Contractuales

#### Crear un nuevo cliente

```http
POST /api/clients
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "nombre_empresa": "Constructora XYZ",
  "cuit": "30-71234572-5",
  "direccion": "Av. Libertador 1234, Buenos Aires",
  "telefono": "011-5678-9012",
  "email": "contacto@constructoraxyz.com",
  "contacto_principal": "Fernando López"
}
```

#### Crear condiciones contractuales

```http
POST /api/contractual_conditions/create
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clientId": 6,
  "tipo_de_contrato": "Permanente",
  "fecha_inicio": "2025-01-01T00:00:00.000Z",
  "fecha_fin": "2025-12-31T00:00:00.000Z",
  "condiciones_especificas": "Incluye servicio de limpieza semanal sin costo adicional",
  "tarifa": 2500,
  "periodicidad": "Mensual",
  "estado": "Activo"
}
```

#### Consultar las condiciones contractuales de un cliente

```http
GET /api/contractual_conditions/client/6
Authorization: Bearer {{token}}
```

## 7. Gestión de Servicios

### 7.1 Creación de Servicios

#### Crear servicio con asignación automática de recursos

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 1,
  "fechaProgramada": "2025-04-20T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Corrientes 1234, Buenos Aires",
  "notas": "Entregar antes de las 9am",
  "asignacionAutomatica": true,
  "condicionContractualId": 1
}
```

### 7.2 Asignación Manual de Recursos

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 2,
  "fechaProgramada": "2025-04-25T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Santa Fe 5678, Buenos Aires",
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 1,
      "vehiculoId": 1,
      "banosIds": [1, 2]
    },
    {
      "empleadoId": 3
    }
  ],
  "condicionContractualId": 2
}
```

### 7.3 Actualización del Estado de un Servicio

#### Iniciar un servicio (cambiar a EN_PROGRESO)

```http
PATCH /api/services/1/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "EN_PROGRESO"
}
```

#### Completar un servicio

```http
PATCH /api/services/1/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "COMPLETADO"
}
```

### 7.4 Servicios para Baños Ya Instalados

#### Consultar baños instalados en un cliente

Para facilitar la creación de servicios que operan sobre baños ya instalados, puede consultar los baños asignados a un cliente específico:

```http
GET /api/chemical_toilets/by-client/3
Authorization: Bearer {{token}}
```

Este endpoint devolverá todos los baños en estado "ASIGNADO" que estén vinculados al cliente especificado, independientemente del estado del servicio de instalación que los asignó.

#### Crear un servicio de LIMPIEZA para baños ya instalados

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 3,
  "fechaProgramada": "2025-05-10T09:00:00.000Z",
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Santa Fe 1234, Buenos Aires",
  "notas": "Limpieza programada según contrato",
  "asignacionAutomatica": true,
  "banosInstalados": [5, 6, 7]
}
```

> **Nota importante**: Para servicios de tipo LIMPIEZA, REEMPLAZO, RETIRO, MANTENIMIENTO_IN_SITU o REPARACION, el campo `cantidadBanos` debe ser 0 y el campo `banosInstalados` debe especificar los IDs de los baños ya instalados en el cliente.

#### Crear un servicio de RETIRO al finalizar contrato

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 3,
  "fechaProgramada": "2025-06-30T09:00:00.000Z",
  "tipoServicio": "RETIRO",
  "cantidadBanos": 0,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Santa Fe 1234, Buenos Aires",
  "notas": "Retiro por finalización de contrato",
  "asignacionAutomatica": true,
  "banosInstalados": [5, 6, 7]
}
```

## 8. Gestión de Personal

### 8.1 Licencias de Empleados

El sistema permite gestionar las licencias y ausencias de los empleados, permitiendo un mejor control de la planificación de recursos.

#### Solicitar una licencia para un empleado

```http
POST /api/employee-leaves
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "empleadoId": 1,
  "tipoLicencia": "VACACIONES",
  "fechaInicio": "2025-07-01T00:00:00.000Z",
  "fechaFin": "2025-07-15T00:00:00.000Z",
  "descripcion": "Vacaciones anuales programadas",
  "documentacionAdjunta": "https://storage.example.com/docs/certificado_vacaciones.pdf"
}
```

#### Aprobar una solicitud de licencia

```http
PATCH /api/employee-leaves/1/aprobar
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "comentariosAprobacion": "Licencia aprobada según planificación anual"
}
```

#### Rechazar una solicitud de licencia

```http
PATCH /api/employee-leaves/2/rechazar
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "comentariosRechazo": "No se puede aprobar por alta demanda de servicios en esas fechas"
}
```

#### Consultar licencias de un empleado

```http
GET /api/employee-leaves/employee/1
Authorization: Bearer {{token}}
```

#### Consultar licencias por período

```http
GET /api/employee-leaves/period?startDate=2025-06-01&endDate=2025-08-31
Authorization: Bearer {{token}}
```

### 8.2 Sistema de Alertas de Licencias

El módulo de alertas de licencias monitorea automáticamente los vencimientos de licencias de conducir de los empleados y envía notificaciones a los administradores.

#### Consultar próximas licencias a vencer

```http
GET /api/employees/license-alerts?days=30
Authorization: Bearer {{token}}
```

Este endpoint devuelve todos los empleados cuyas licencias de conducir vencen en los próximos 30 días.

#### Actualizar fecha de vencimiento de licencia

```http
PATCH /api/employees/1/update-license
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "fechaVencimientoLicencia": "2026-05-01T00:00:00.000Z",
  "tipoLicencia": "B"
}
```

### 8.3 Solicitudes de Adelanto de Sueldo

El sistema permite gestionar solicitudes de adelanto de sueldo por parte de los empleados.

#### Crear una solicitud de adelanto

```http
POST /api/salary_advance
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "empleadoId": 2,
  "monto": 15000,
  "motivo": "Gastos médicos",
  "fechaSolicitud": "2025-05-05T00:00:00.000Z",
  "fechaPago": "2025-05-10T00:00:00.000Z"
}
```

#### Aprobar una solicitud de adelanto

```http
PATCH /api/salary_advance/1/approve
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "comentariosAprobacion": "Aprobado según política de la empresa"
}
```

#### Rechazar una solicitud de adelanto

```http
PATCH /api/salary_advance/2/reject
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "comentariosRechazo": "Excede el monto máximo permitido mensual"
}
```

#### Consultar solicitudes por estado

```http
GET /api/salary_advance?estado=PENDIENTE
Authorization: Bearer {{token}}
```

## 9. Portal de Clientes

El Portal de Clientes proporciona una interfaz para que los clientes interactúen con MVA, permitiendo enviar encuestas de satisfacción, registrar reclamos y solicitar nuevos servicios.

### 9.1 Gestión de Reclamos

#### Crear un reclamo (acceso público)

```http
POST /api/clients_portal/claims
Content-Type: application/json

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

#### Obtener todos los reclamos (solo administradores y supervisores)

```http
GET /api/clients_portal/claims
Authorization: Bearer {{token}}
```

#### Actualizar estado de un reclamo

```http
PATCH /api/clients_portal/claims/1/status
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "EN_PROCESO",
  "comentarios": "Se ha asignado un técnico para revisión del problema"
}
```

### 9.2 Encuestas de Satisfacción

#### Enviar una encuesta de satisfacción (acceso público)

```http
POST /api/clients_portal/surveys
Content-Type: application/json

{
  "nombreCliente": "Constructora ABC",
  "emailContacto": "cliente@constructoraabc.com",
  "servicioRealizado": "INSTALACION",
  "fechaServicio": "2025-05-01T00:00:00.000Z",
  "calificacionGeneral": 4,
  "puntualidad": 5,
  "calidadServicio": 4,
  "atencionPersonal": 5,
  "comentarios": "Buen servicio en general, pero uno de los baños tenía problemas con el dispensador de papel."
}
```

#### Obtener todas las encuestas

```http
GET /api/clients_portal/surveys
Authorization: Bearer {{token}}
```

#### Obtener estadísticas de satisfacción

```http
GET /api/clients_portal/surveys/stats
Authorization: Bearer {{token}}
```

### 9.3 Solicitudes de Servicio

#### Solicitar un nuevo servicio (acceso público)

```http
POST /api/clients_portal/service-requests
Content-Type: application/json

{
  "nombreEmpresa": "Eventos Corporativos XYZ",
  "nombreContacto": "Carlos Gómez",
  "telefonoContacto": "11-5678-9012",
  "emailContacto": "carlos@eventosxyz.com",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 5,
  "ubicacion": "Parque Industrial Norte, Galpón 8",
  "fechaDeseada": "2025-06-10T08:00:00.000Z",
  "duracionEstimada": 7,
  "detallesAdicionales": "Evento corporativo para 300 personas, se requiere incluir un baño para personas con movilidad reducida"
}
```

#### Obtener todas las solicitudes de servicio

```http
GET /api/clients_portal/service-requests
Authorization: Bearer {{token}}
```

#### Convertir solicitud en servicio programado

```http
POST /api/clients_portal/service-requests/1/convert
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 5,
  "fechaProgramada": "2025-06-10T08:00:00.000Z",
  "cantidadBanos": 5,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "condicionContractualId": 8
}
```

## 10. Limpiezas Futuras

El módulo de Limpiezas Futuras permite programar y gestionar las limpiezas programadas de baños químicos para clientes específicos.

### 10.1 Programación de Limpiezas

#### Crear una nueva limpieza futura

```http
POST /api/future_cleanings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clientId": 5,
  "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
  "isActive": true,
  "servicioId": 8
}
```

#### Obtener todas las limpiezas futuras

```http
GET /api/future_cleanings
Authorization: Bearer {{token}}
```

### 10.2 Gestión de Limpiezas Programadas

#### Modificar estado de una limpieza futura

```http
PUT /api/future_cleanings/modify/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "isActive": false
}
```

#### Eliminar una limpieza futura

```http
DELETE /api/future_cleanings/delete/1
Authorization: Bearer {{token}}
```

#### Programación de múltiples limpiezas para un servicio recurrente

Para un cliente con un contrato de mantenimiento semanal, se pueden programar múltiples limpiezas futuras con fechas escalonadas:

```http
POST /api/future_cleanings
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clientId": 5,
  "fecha_de_limpieza": "2025-05-15T09:00:00.000Z",
  "isActive": true,
  "servicioId": 8
}
```

Repetir este proceso para cada fecha de limpieza (22/05/2025, 29/05/2025, etc.)

## 11. Flujos Administrativos Completos

### 11.1 Flujo de Instalación

Paso a paso para completar una instalación de baños químicos:

1. **Registrar al cliente (si es nuevo)**

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
  "clientId": 7,
  "tipo_de_contrato": "Temporal",
  "fecha_inicio": "2025-05-01T00:00:00.000Z",
  "fecha_fin": "2025-05-31T00:00:00.000Z",
  "condiciones_especificas": "Contrato para evento de 3 días",
  "tarifa": 2500,
  "periodicidad": "Total",
  "estado": "Activo"
}
```

3. **Crear el servicio de instalación**

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 7,
  "fechaProgramada": "2025-05-01T08:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 5,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "ubicacion": "Ruta 2 km 50, Salón Principal",
  "notas": "Evento de 3 días con 1000 asistentes",
  "asignacionAutomatica": true,
  "condicionContractualId": 3
}
```

4. **Verificar las asignaciones realizadas**

```http
GET /api/services/3
Authorization: Bearer {{token}}
```

5. **Iniciar el servicio el día de la instalación**

```http
PATCH /api/services/3/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "EN_PROGRESO"
}
```

6. **Completar el servicio una vez instalados los baños**

```http
PATCH /api/services/3/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "COMPLETADO"
}
```

7. **Verificar que los baños siguen ASIGNADOS al cliente a pesar de haber completado el servicio**

```http
GET /api/chemical_toilets/by-client/7
Authorization: Bearer {{token}}
```

8. **Programar servicio de limpieza según frecuencia contractual**

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 7,
  "fechaProgramada": "2025-05-04T10:00:00.000Z",
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Ruta 2 km 50, Salón Principal",
  "asignacionAutomatica": true,
  "banosInstalados": [10, 11, 12, 13, 14]
}
```

9. **Programar servicio de retiro al finalizar el evento**

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 7,
  "fechaProgramada": "2025-05-31T18:00:00.000Z",
  "tipoServicio": "RETIRO",
  "cantidadBanos": 0,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "ubicacion": "Ruta 2 km 50, Salón Principal",
  "asignacionAutomatica": true,
  "banosInstalados": [10, 11, 12, 13, 14]
}
```

### 11.2 Flujo de Mantenimiento Programado

Paso a paso para gestionar el mantenimiento programado de recursos:

1. **Programar mantenimiento futuro para vehículo**

```http
POST /api/vehicle_maintenance
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "vehiculoId": 3,
  "fechaMantenimiento": "2025-05-10T09:00:00.000Z",
  "tipoMantenimiento": "Preventivo",
  "descripcion": "Cambio de aceite, filtros y revisión general",
  "costo": 18000,
  "proximoMantenimiento": "2025-08-10T09:00:00.000Z"
}
```

2. **Verificar que el vehículo permanece como DISPONIBLE hasta la fecha**

```http
GET /api/vehicles/3
Authorization: Bearer {{token}}
```

3. **Intentar asignar el vehículo para un servicio en la fecha de mantenimiento**

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 2,
  "fechaProgramada": "2025-05-10T10:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 1,
  "cantidadEmpleados": 1,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Callao 123",
  "asignacionAutomatica": true
}
```

> **Nota:** El sistema no asignará el vehículo 3 aunque esté en estado DISPONIBLE, porque tiene un mantenimiento programado para ese día.

4. **El día del mantenimiento, el scheduler cambia automáticamente el estado a EN_MANTENIMIENTO**

5. **Al finalizar el mantenimiento, completarlo manualmente**

```http
PATCH /api/vehicle_maintenance/3/complete
Authorization: Bearer {{token}}
```

### 11.3 Gestión de Imprevistos

Pasos para manejar situaciones imprevistas:

1. **Un vehículo se avería durante un servicio**

   a. Cambiar el estado del vehículo:

   ```http
   PATCH /api/vehicles/4/estado
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "estado": "FUERA_DE_SERVICIO"
   }
   ```

   b. Registrar un mantenimiento correctivo:

   ```http
   POST /api/vehicle_maintenance
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "vehiculoId": 4,
     "fechaMantenimiento": "2025-04-10T14:00:00.000Z",
     "tipoMantenimiento": "Correctivo",
     "descripcion": "Avería en el sistema de transmisión",
     "costo": 35000
   }
   ```

   c. Asignar otro vehículo al servicio en progreso:

   ```http
   PUT /api/services/2
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "asignacionesManual": [
       {
         "empleadoId": 2,
         "vehiculoId": 5,
         "banosIds": [3, 4]
       }
     ]
   }
   ```

2. **Un empleado reporta enfermedad**

   a. Cambiar el estado del empleado:

   ```http
   PATCH /api/employees/4/estado
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "estado": "LICENCIA"
   }
   ```

   b. Reasignar servicios:

   ```http
   PUT /api/services/3
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "asignacionesManual": [
       {
         "empleadoId": 6,
         "vehiculoId": 1,
         "banosIds": [5, 6]
       }
     ]
   }
   ```

### 11.4 Flujo de Retiro

Este flujo corresponde a la finalización de un contrato y el retiro de los baños instalados en el cliente.

1. **Verificar los baños instalados en el cliente**

```http
GET /api/chemical_toilets/by-client/7
Authorization: Bearer {{token}}
```

2. **Programar el servicio de retiro**

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 7,
  "fechaProgramada": "2025-05-31T18:00:00.000Z",
  "tipoServicio": "RETIRO",
  "cantidadBanos": 0,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "ubicacion": "Ruta 2 km 50, Salón Principal",
  "asignacionAutomatica": true,
  "banosInstalados": [10, 11, 12, 13, 14]
}
```

3. **Iniciar el servicio el día del retiro**

```http
PATCH /api/services/5/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "EN_PROGRESO"
}
```

4. **Completar el servicio una vez retirados los baños**

```http
PATCH /api/services/5/estado
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "estado": "COMPLETADO"
}
```

5. **Verificar que los baños han cambiado a estado EN_MANTENIMIENTO**

```http
GET /api/chemical_toilets/10
GET /api/chemical_toilets/11
Authorization: Bearer {{token}}
```

> **Nota**: Al completar un servicio de RETIRO, el sistema cambia automáticamente el estado de los baños retirados de ASIGNADO a EN_MANTENIMIENTO para su limpieza y acondicionamiento antes de volver a estar disponibles.

## 12. Gestión de Informes

### Generar reportes de servicios por cliente

```http
GET /api/services?clienteId=1
Authorization: Bearer {{token}}
```

### Reportes de mantenimientos completados por período

```http
GET /api/vehicle_maintenance/search?completado=true&fechaDesde=2025-01-01T00:00:00.000Z&fechaHasta=2025-04-30T23:59:59.999Z
Authorization: Bearer {{token}}
```

### Estadísticas de mantenimiento por baño

```http
GET /api/chemical_toilets/stats/1
Authorization: Bearer {{token}}
```

### Reportes de actividad de usuarios

```http
GET /api/activity-logs?userId=2&startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
Authorization: Bearer {{token}}
```

## 13. Servicio de Programación (Scheduler)

El sistema incluye un servicio de programación que automatiza varias tareas críticas:

### Cambio automático de estados en mantenimientos programados

El scheduler se encarga de:

- Cambiar automáticamente el estado de vehículos y baños cuando llega la fecha de un mantenimiento programado
- Actualizar estados al completarse un mantenimiento
- Enviar notificaciones cuando un recurso entra en mantenimiento

### Alerta de vencimientos de licencias

El scheduler monitorea:

- Fechas de vencimiento de licencias de conducir
- Genera alertas automáticas cuando una licencia está próxima a vencer
- Envía correos a los administradores como recordatorio

### Programación de limpiezas futuras

El scheduler gestiona:

- Conversión automática de limpiezas futuras a servicios programados cuando llega la fecha
- Actualización de estados de limpiezas completadas
- Gestión de la secuencia de limpiezas programadas para un mismo cliente

### Configuración del Scheduler

El servicio de programación se ejecuta en segundo plano y puede configurarse en el archivo `src/scheduler/scheduler.service.ts`. Las principales configuraciones incluyen:

- Frecuencia de ejecución de las verificaciones
- Umbrales de alerta (días antes del vencimiento)
- Destinatarios de notificaciones

## 14. Resolución de Problemas Comunes

### Problemas de autenticación

Si recibes errores de autenticación:

1. **Verifica que el token es válido y no ha expirado**

   ```http
   POST /api/auth/login
   Content-Type: application/json

   {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **Asegúrate de incluir el prefijo "Bearer" antes del token**

   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Verifica que el usuario tenga los permisos adecuados**

   ```http
   GET /api/users/me
   Authorization: Bearer {{token}}
   ```

### Error en la asignación de recursos

Si al crear un servicio recibes un error de recursos insuficientes:

1. **Verificar la disponibilidad de recursos**

   ```http
   GET /api/employees?estado=DISPONIBLE
   GET /api/vehicles?estado=DISPONIBLE
   GET /api/chemical_toilets/search?estado=DISPONIBLE
   ```

2. **Verificar mantenimientos programados**

   ```http
   GET /api/vehicle_maintenance/upcoming
   GET /api/toilet_maintenance?completado=false
   ```

3. **Verificar asignaciones existentes**
   ```http
   GET /api/services?estado=PROGRAMADO&fechaProgramada=2025-05-20
   ```

### Error al cambiar el estado de un servicio

Si no puedes cambiar el estado de un servicio a COMPLETADO:

1. Verifica que el servicio esté en estado EN_PROGRESO:

   ```http
   GET /api/services/1
   Authorization: Bearer {{token}}
   ```

2. Verifica que todas las tareas relacionadas estén completadas.

3. Si es necesario, utiliza el modo forzado (solo para administradores):

   ```http
   PATCH /api/services/1/estado
   Authorization: Bearer {{token}}
   Content-Type: application/json

   {
     "estado": "COMPLETADO",
     "forzar": true
   }
   ```

### Error en servicios que operan sobre baños ya instalados

Si al crear un servicio de LIMPIEZA, REEMPLAZO o RETIRO recibe un error sobre los baños:

1. **Asegurarse de establecer cantidadBanos en 0**

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,  // Debe ser 0
  "banosInstalados": [5, 6, 7]  // Obligatorio
}
```

2. **Verificar que los baños listados estén asignados al cliente**

```http
GET /api/chemical_toilets/by-client/{clientId}
Authorization: Bearer {{token}}
```

3. **Comprobar que los baños listados estén en estado ASIGNADO**

```http
GET /api/chemical_toilets/{banoId}
Authorization: Bearer {{token}}
```

### Problemas con la gestión de usuarios

Si experimentas problemas al crear o actualizar usuarios:

1. **Verificar que el nombre de usuario y email sean únicos**

   ```http
   GET /api/users?nombre=nuevo_usuario
   GET /api/users?email=usuario@mva.com
   ```

2. **Asegurarse de que las contraseñas cumplan los requisitos**

   - Entre 6 y 30 caracteres
   - Incluir al menos una letra y un número

3. **Verificar los roles asignados**
   - Los roles válidos son: ADMIN, SUPERVISOR, OPERARIO
   - Solo un ADMIN puede asignar el rol ADMIN

## 15. Mejores Prácticas

### Seguridad y Autenticación

1. **Cambiar regularmente las contraseñas** de las cuentas administrativas.
2. **Utilizar contraseñas fuertes** con combinación de letras, números y símbolos.
3. **No compartir tokens JWT** entre usuarios o sistemas.
4. **Cerrar sesión** cuando no se esté utilizando el sistema.
5. **Revisar periódicamente los registros de actividad** para detectar comportamientos anómalos.

### Planificación de Recursos

1. **Programar los mantenimientos con anticipación** para evitar conflictos con servicios.
2. **Mantener un buffer de recursos** (aproximadamente 20% más de lo necesario) para imprevistos.
3. **Verificar disponibilidad antes de crear servicios** con fechas críticas.

### Gestión de Estados

1. **Respetar el flujo de estados** de los servicios: PROGRAMADO -> EN_PROGRESO -> COMPLETADO.
2. **Actualizar el estado de los empleados** cuando toman licencias o vacaciones.
3. **Completar los mantenimientos apenas finalizan** para liberar los recursos.

### Asignación de Recursos

1. **Preferir la asignación automática** para servicios estándar.
2. **Usar asignación manual** para casos especiales o recursos específicos.
3. **Verificar las asignaciones después de crearlas** para confirmar que sean adecuadas.
4. **Utilizar la asignación múltiple de recursos** para optimizar la planificación de servicios en la misma fecha.

### Gestión de Tipos de Servicio

1. **Identificar correctamente el tipo de servicio** para aplicar las reglas adecuadas de recursos.
2. **Para servicios de INSTALACION o TRASLADO**, asegurarse de que cantidadBanos > 0.
3. **Para servicios de LIMPIEZA, REEMPLAZO, RETIRO o MANTENIMIENTO_IN_SITU**, establecer cantidadBanos = 0 y proporcionar los IDs de baños ya instalados.
4. **Utilizar el endpoint /api/chemical_toilets/by-client/{clientId}** para obtener la lista de baños ya instalados en un cliente.
5. **Vincular los servicios de instalación con las condiciones contractuales** para gestionar correctamente la duración del alquiler.

## 16. Programación de Agenda Extendida

### 16.1 Asignación Múltiple de Recursos

A partir de ahora, el sistema permite asignar empleados y vehículos que tengan el estado "ASIGNADO" a múltiples servicios programados para la misma fecha o para fechas futuras. Esta funcionalidad facilita la planificación de agendas extendidas.

#### Comportamiento

- Los empleados y vehículos pueden estar asignados a múltiples servicios en la misma fecha.
- Los recursos cambiarán al estado "ASIGNADO" únicamente cuando pasen de "DISPONIBLE" a "ASIGNADO".
- Si ya están en estado "ASIGNADO", mantendrán ese estado al asignarlos a un nuevo servicio.
- El estado "ASIGNADO" indica que el recurso está siendo utilizado en al menos un servicio activo.
- Cuando se completan o cancelan todos los servicios asociados a un recurso, éste volverá al estado "DISPONIBLE".
- **Importante**: Los baños químicos siguen requiriendo el estado "DISPONIBLE" para ser asignados a un servicio, excepto para servicios de LIMPIEZA, REEMPLAZO, RETIRO y MANTENIMIENTO_IN_SITU que requieren baños ya instalados en estado ASIGNADO.

#### Casos de Uso

Esta funcionalidad es especialmente útil para:

1. **Planificación de jornadas completas**: Asignar a un mismo empleado y vehículo varios servicios a realizar durante el mismo día.
2. **Optimización de recursos**: Maximizar la utilización de los recursos disponibles.
3. **Agendamiento secuencial**: Programar con anticipación una serie de servicios que utilizarán los mismos recursos.

### 16.2 Cómo Utilizar esta Funcionalidad

#### Asignación Manual de Recursos

Para asignar manualmente recursos que ya están asignados a otros servicios:

1. Al crear o actualizar un servicio, establezca `asignacionAutomatica: false`.
2. En el campo `asignacionesManual`, incluya los IDs de los recursos que desea asignar:

```json
{
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 1,
      "vehiculoId": 2,
      "banosIds": [3]
    }
  ]
}
```

3. El sistema verificará que:
   - Los empleados y vehículos especificados estén en estado "DISPONIBLE" o "ASIGNADO".
   - Los baños especificados estén en estado "DISPONIBLE" o en estado "ASIGNADO" para servicios de baños ya instalados.

#### Asignación Automática de Recursos

Cuando se utiliza la asignación automática, el sistema:

1. Buscará recursos disponibles, incluyendo aquellos con estado "ASIGNADO".
2. Intentará distribuir los recursos de manera óptima.
3. Cambiará el estado de los recursos que estén "DISPONIBLE" a "ASIGNADO".
4. Mantendrá el estado de los recursos que ya estén "ASIGNADO".

#### Verificación de Disponibilidad

Para verificar qué recursos están disponibles para una fecha específica:

1. Consulte los endpoints de empleados, vehículos y baños químicos.
2. Filtre por estado "DISPONIBLE" o "ASIGNADO" para empleados y vehículos.
3. Filtre por estado "DISPONIBLE" para baños químicos (o "ASIGNADO" si se trata de un servicio de baños ya instalados).

### 16.3 Consideraciones Importantes

- El sistema no considera las horas de los servicios, solo las fechas, por lo que debe planificar adecuadamente para evitar conflictos de horarios.
- Cuando un servicio se completa o cancela, los recursos asociados se liberan (cambian a "DISPONIBLE") solo si no están asignados a otros servicios activos.
- Los mantenimientos programados para vehículos y baños químicos son respetados, independientemente del estado actual del recurso.
- Los baños permanecen en estado ASIGNADO después de completar un servicio de instalación, hasta que se realiza un servicio de RETIRO o hasta que finaliza el contrato asociado.

### 16.4 Ejemplos Prácticos

#### Ejemplo 1: Creación de múltiples servicios para la misma fecha con los mismos recursos

1. **Crear el primer servicio**:

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 1,
  "fechaProgramada": "2025-06-10T08:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 1,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Libertador 1500",
  "asignacionAutomatica": true,
  "condicionContractualId": 1
}
```

2. **Crear un segundo servicio para la misma fecha usando los mismos empleados y vehículos**:

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

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
  ],
  "condicionContractualId": 2
}
```

#### Ejemplo 2: Verificación de la disponibilidad de recursos asignados

Para comprobar que un empleado o vehículo ya asignado puede ser asignado a un nuevo servicio:

```http
GET /api/employees/1
Authorization: Bearer {{token}}
```

Si el estado es "ASIGNADO", aún puede ser utilizado en otro servicio:

```http
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 3,
  "fechaProgramada": "2025-06-11T10:00:00.000Z",
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,
  "cantidadEmpleados": 1,
  "cantidadVehiculos": 1,
  "ubicacion": "Av. Santa Fe 2000",
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 1,
      "vehiculoId": 2
    }
  ],
  "banosInstalados": [4, 5]
}
```

#### Ejemplo 3: Programar una agenda semanal para un equipo

Se puede planificar toda una semana de trabajo para un mismo equipo (empleado + vehículo), garantizando la continuidad:

```http
# Día 1 - Lunes
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 1,
  "fechaProgramada": "2025-06-15T09:00:00.000Z",
  "tipoServicio": "INSTALACION",
  "cantidadBanos": 2,
  "cantidadEmpleados": 1,
  "cantidadVehiculos": 1,
  "asignacionAutomatica": true,
  "condicionContractualId": 1
}

# Día 2 - Martes (usando los mismos recursos del día anterior)
POST /api/services
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 2,
  "fechaProgramada": "2025-06-16T09:00:00.000Z",
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 0,
  "cantidadEmpleados": 1,
  "cantidadVehiculos": 1,
  "asignacionAutomatica": false,
  "asignacionesManual": [
    {
      "empleadoId": 1,
      "vehiculoId": 1
    }
  ],
  "banosInstalados": [5, 6, 7]
}

# Y así sucesivamente para el resto de la semana...
```
