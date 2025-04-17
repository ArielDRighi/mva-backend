# Tutorial Completo: MVA Backend - De la Inserción de Datos al Flujo Administrativo

## Índice

1. Preparación del Entorno
2. Población Inicial de la Base de Datos
3. Gestión de Recursos
   - 3.1 Gestión de Empleados
   - 3.2 Gestión de Vehículos
   - 3.3 Gestión de Baños Químicos
4. Gestión de Mantenimientos
   - 4.1 Mantenimiento de Vehículos
   - 4.2 Mantenimiento de Baños Químicos
5. Gestión de Clientes y Condiciones Contractuales
6. Gestión de Servicios
   - 6.1 Creación de Servicios
   - 6.2 Asignación Manual de Recursos
   - 6.3 Actualización del Estado de un Servicio
7. Flujos Administrativos Completos
   - 7.1 Flujo de Instalación
   - 7.2 Flujo de Mantenimiento Programado
   - 7.3 Gestión de Imprevistos
8. Gestión de Informes
9. Resolución de Problemas Comunes
10. Mejores Prácticas

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
npx ts-node src/scripts/seed-test-data.ts
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

## 3. Gestión de Recursos

### 3.1 Gestión de Empleados

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

### 3.2 Gestión de Vehículos

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

### 3.3 Gestión de Baños Químicos

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

## 4. Gestión de Mantenimientos

### 4.1 Mantenimiento de Vehículos

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

### 4.2 Mantenimiento de Baños Químicos

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

## 5. Gestión de Clientes y Condiciones Contractuales

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
POST /api/contractual_conditions
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "clienteId": 6,
  "costo_instalacion": 15000,
  "costo_alquiler_dia": 2000,
  "costo_retiro": 15000,
  "costo_limpieza": 5000,
  "frecuencia_limpieza": 7,
  "fecha_inicio": "2025-04-15T00:00:00.000Z",
  "fecha_fin": "2025-12-31T00:00:00.000Z"
}
```

## 6. Gestión de Servicios

### 6.1 Creación de Servicios

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
  "asignacionAutomatica": true
}
```

### 6.2 Asignación Manual de Recursos

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
  ]
}
```

### 6.3 Actualización del Estado de un Servicio

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

## 7. Flujos Administrativos Completos

### 7.1 Flujo de Instalación

Paso a paso para completar una instalación de baños químicos:

1. **Registrar al cliente (si es nuevo)**

```http
POST /api/clients
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
POST /api/contractual_conditions
Content-Type: application/json

{
  "clienteId": 7,
  "costo_instalacion": 18000,
  "costo_alquiler_dia": 2500,
  "costo_retiro": 18000,
  "costo_limpieza": 6000,
  "frecuencia_limpieza": 3,
  "fecha_inicio": "2025-05-01T00:00:00.000Z",
  "fecha_fin": "2025-05-31T00:00:00.000Z"
}
```

3. **Crear el servicio de instalación**

```http
POST /api/services
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
  "asignacionAutomatica": true
}
```

4. **Verificar las asignaciones realizadas**

```http
GET /api/services/3
```

5. **Iniciar el servicio el día de la instalación**

```http
PATCH /api/services/3/estado
Content-Type: application/json

{
  "estado": "EN_PROGRESO"
}
```

6. **Completar el servicio una vez instalados los baños**

```http
PATCH /api/services/3/estado
Content-Type: application/json

{
  "estado": "COMPLETADO"
}
```

7. **Programar servicio de limpieza según frecuencia contractual**

```http
POST /api/services
Content-Type: application/json

{
  "clienteId": 7,
  "fechaProgramada": "2025-05-04T10:00:00.000Z",
  "tipoServicio": "LIMPIEZA",
  "cantidadBanos": 5,
  "cantidadEmpleados": 2,
  "cantidadVehiculos": 1,
  "ubicacion": "Ruta 2 km 50, Salón Principal",
  "asignacionAutomatica": true
}
```

8. **Programar servicio de retiro al finalizar el evento**

```http
POST /api/services
Content-Type: application/json

{
  "clienteId": 7,
  "fechaProgramada": "2025-05-31T18:00:00.000Z",
  "tipoServicio": "RETIRO",
  "cantidadBanos": 5,
  "cantidadEmpleados": 3,
  "cantidadVehiculos": 2,
  "ubicacion": "Ruta 2 km 50, Salón Principal",
  "asignacionAutomatica": true
}
```

### 7.2 Flujo de Mantenimiento Programado

Paso a paso para gestionar el mantenimiento programado de recursos:

1. **Programar mantenimiento futuro para vehículo**

```http
POST /api/vehicle_maintenance
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
```

3. **Intentar asignar el vehículo para un servicio en la fecha de mantenimiento**

```http
POST /api/services
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
```

### 7.3 Gestión de Imprevistos

Pasos para manejar situaciones imprevistas:

1. **Un vehículo se avería durante un servicio**

   a. Cambiar el estado del vehículo:

   ```http
   PATCH /api/vehicles/4/estado
   Content-Type: application/json

   {
     "estado": "FUERA_DE_SERVICIO"
   }
   ```

   b. Registrar un mantenimiento correctivo:

   ```http
   POST /api/vehicle_maintenance
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
   Content-Type: application/json

   {
     "estado": "LICENCIA"
   }
   ```

   b. Reasignar servicios:

   ```http
   PUT /api/services/3
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

## 8. Gestión de Informes

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

## 9. Resolución de Problemas Comunes

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
   ```

2. Verifica que todas las tareas relacionadas estén completadas.

3. Si es necesario, utiliza el modo forzado (solo para administradores):

   ```http
   PATCH /api/services/1/estado
   Content-Type: application/json

   {
     "estado": "COMPLETADO",
     "forzar": true
   }
   ```

## 10. Mejores Prácticas

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

---

Con este tutorial completo, cualquier administrador del sistema MVA puede gestionar el ciclo completo de operaciones, desde la creación de recursos hasta la planificación y ejecución de servicios, incluyendo el mantenimiento preventivo y correctivo de la flota y equipos.
