# Documentación del Script de Datos de Prueba (seed-test-data)

## Descripción

El script seed-test-data.ts está diseñado para poblar la base de datos de la aplicación MVA Backend con datos de prueba para facilitar el desarrollo y las pruebas. Este script inserta:

- Clientes
- Empleados
- Vehículos
- Baños químicos

Además, el script verifica la existencia previa de registros para evitar duplicados.

## Requisitos previos

Antes de ejecutar el script, asegúrate de:

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

### Paso 2: Ejecutar el script

Hay dos formas de ejecutar el script:

#### Opción 1: Ejecutar directamente con ts-node

```bash
npx ts-node src/scripts/seed-test-data.ts
```

#### Opción 2: Ejecutar el script compilado

```bash
node dist/scripts/seed-test-data.js
```

### Paso 3: Verificar la ejecución

El script mostrará mensajes en la consola indicando el progreso y resultado:

```
Iniciando proceso de inserción de datos de prueba...
Conexión a la base de datos establecida correctamente
Insertando clientes...
Cliente con CUIT 30-71234567-0 ya existe, omitiendo...
Cliente con CUIT 30-71234568-1 ya existe, omitiendo...
Clientes insertados: 3
Insertando empleados...
Empleado con documento 25789456 ya existe, omitiendo...
Empleados insertados: 4
Insertando vehículos...
Vehículo con placa AA123BB ya existe, omitiendo...
Vehículos insertados: 5
Insertando baños químicos...
Baño con código interno BQ-2022-001 ya existe, omitiendo...
Baños químicos insertados: 10
Total de clientes en la base de datos: 5
Total de empleados en la base de datos: 4
Total de vehículos en la base de datos: 5
Total de baños químicos en la base de datos: 10
¡Datos de prueba insertados correctamente!
Conexión a la base de datos cerrada
Script finalizado correctamente
```

## Datos insertados

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

## Personalización

Si deseas modificar los datos insertados:

1. Abre el archivo seed-test-data.ts
2. Modifica los arrays de datos:

   - `clientes`
   - `empleados`
   - `vehiculos`
   - Para los baños químicos, ajusta el bucle for que genera 10 baños

3. Guarda los cambios y vuelve a ejecutar el script

## Consideraciones

- El script no elimina datos existentes, solo agrega nuevos registros
- Si un registro ya existe (basado en CUIT, documento, placa o código interno), será omitido
- Todos los recursos se crean con estado `DISPONIBLE` por defecto
- La fecha de contratación de los empleados se establece aproximadamente un año antes de la ejecución del script
- La fecha de adquisición de los baños se establece aproximadamente dos años antes de la ejecución del script

## Resolución de problemas

### Error de conexión a la base de datos

Verifica las credenciales en el archivo .env y asegúrate de que la base de datos esté en ejecución.

### Error: "La entidad ya existe"

El script ya incluye verificaciones para evitar duplicados. Si persisten los errores, considera limpiar la base de datos antes de ejecutar el script.

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

# Ejecutamos el script
npx ts-node src/scripts/seed-test-data.ts

# Alternativa: ejecutar la versión compilada
# node dist/scripts/seed-test-data.js

# Verificamos en la base de datos que se hayan creado los registros
# usando algún cliente como pgAdmin o DBeaver
```
