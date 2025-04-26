# Documentación de Scripts de Datos (Seed)

## Descripción

El proyecto MVA Backend incluye varios scripts para poblar la base de datos con diferentes tipos de datos:

1. **seed-test-data.ts**: Inserta datos básicos de prueba (clientes, empleados, vehículos y baños químicos)
2. **seed-clients.ts**: Inserta 100 clientes aleatorios con datos realistas
3. **create-admin-standalone.ts**: Crea un usuario administrador

Todos los scripts verifican la existencia previa de registros para evitar duplicados.

## Requisitos previos

Antes de ejecutar cualquier script, asegúrate de:

1. Tener configurado el archivo .env con las credenciales de la base de datos:

   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=tu_contraseña
   DB_DATABASE=mva_db
   DB_SCHEMA=public
   ```

2. Tener la estructura de la base de datos creada (las entidades y tablas).

3. Tener instaladas las dependencias del proyecto:

   ```bash
   npm install
   ```

4. Haber compilado el proyecto TypeScript:
   ```bash
   npm run build
   ```

## Instrucciones de ejecución

### Paso 1: Navegar al directorio del proyecto

```bash
cd d:/Personal/mva-backend
```

### Paso 2: Ejecutar el script deseado

Todos los scripts de datos pueden ejecutarse de manera uniforme usando los comandos npm configurados en package.json:

#### Para insertar datos básicos de prueba (empleados, vehículos, baños y algunos clientes):

```bash
npm run seed:test-data
```

#### Para insertar 100 clientes aleatorios:

```bash
npm run seed:clients
```

#### Para crear un usuario administrador:

```bash
npm run seed:admin
```

### Paso 3: Verificar la ejecución

Los scripts mostrarán mensajes en la consola indicando el progreso y resultado.

## Script: seed-test-data

Este script inserta:

### Clientes

- Constructora ABC
- Eventos del Sur
- Municipalidad de Rosario
- Festival Nacional
- Petrolera NOA

### Empleados

- Carlos Rodríguez (Conductor)
- Laura Gómez (Técnico)
- Martín López (Operario)
- Ana Martínez (Supervisor)
- Diego Fernández (Conductor)

### Vehículos

- Ford F-100 (AA123BB)
- Chevrolet S10 (AC456DD)
- Toyota Hilux (AD789FF)
- Volkswagen Amarok (AE012HH)
- Fiat Strada (AF345JJ)

### Baños Químicos

- 10 baños químicos con modelos alternados entre: Estándar, Premium y Portátil
- Códigos internos: BQ-2022-001 hasta BQ-2022-010

## Script: seed-clients

Este script inserta 100 clientes con:

- Nombres de empresas generados aleatoriamente
- CUITs únicos con formato válido
- Direcciones con calles y ciudades de Argentina
- Teléfonos con formato argentino
- Emails corporativos
- Nombres de contactos principal

El script muestra el progreso cada 10 clientes insertados y al final muestra el número total de clientes en la base de datos.

## Script: seed-admin

Este script crea un usuario administrador con las siguientes credenciales:

| Campo    | Valor         |
| -------- | ------------- |
| Username | admin         |
| Password | admin123      |
| Email    | admin@mva.com |
| Rol      | ADMIN         |

> **¡IMPORTANTE!** Recuerda cambiar la contraseña después del primer inicio de sesión.

## Personalización

Si deseas modificar los datos insertados:

1. Abre el archivo del script correspondiente (seed-test-data.ts, seed-clients.ts, etc.)
2. Modifica los datos según sea necesario
3. Guarda los cambios y vuelve a ejecutar el script

## Consideraciones

- Los scripts no eliminan datos existentes, solo agregan nuevos registros
- Si un registro ya existe, será omitido para evitar duplicados
- Todos los recursos se crean con estado `DISPONIBLE` o `ACTIVO` por defecto

## Resolución de problemas

### Error de conexión a la base de datos

Verifica las credenciales en el archivo .env y asegúrate de que la base de datos esté en ejecución.

### Error: "La entidad ya existe"

Los scripts incluyen verificaciones para evitar duplicados. Si persisten los errores, considera limpiar la base de datos antes de ejecutar el script.

### Error: "Column xxx does not exist"

Asegúrate de haber migrado correctamente la estructura de la base de datos antes de ejecutar el script.

## Ejemplo completo de ejecución

```bash
# Navegamos al directorio del proyecto
cd d:/Personal/mva-backend

# Nos aseguramos de tener las últimas dependencias
npm install

# Compilamos el proyecto
npm run build

# Ejecutamos todos los scripts en orden
npm run seed:admin
npm run seed:test-data
npm run seed:clients
```
