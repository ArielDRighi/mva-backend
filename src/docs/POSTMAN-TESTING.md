# Solución para errores Bad Request en Postman

Este documento explica cómo solucionar los errores "Bad Request" (400) y "Internal Server Error" (500) que aparecen al ejecutar la colección de Postman.

## Problema

Al ejecutar la colección de Postman, muchas solicitudes fallan con errores 400 (Bad Request) o 500 (Internal Server Error). Esto ocurre porque:

1. La colección utiliza variables de ruta como `{{id}}`, `{{placa}}`, etc., que no tienen valores asignados o no corresponden a registros existentes en la base de datos.

2. Las solicitudes POST, PUT y PATCH envían cuerpos JSON incompletos o con datos inválidos.

## Solución

Hemos implementado las siguientes mejoras:

1. Un archivo de entorno de Postman ampliado con variables para todos los IDs necesarios (`id`, `clientId`, `vehicleId`, etc.)

2. Un script `create-postman-test-data.ts` que:

   - Crea datos de prueba reales en la base de datos
   - Actualiza automáticamente el archivo de entorno con los IDs reales
   - Garantiza que el usuario administrador para Postman exista

3. Nuevos comandos npm para facilitar el proceso:
   - `npm run seed:postman` - Crea los datos de prueba y actualiza las variables
   - `npm run setup:postman` - Ejecuta el script anterior y luego la colección de Postman

## Instrucciones de uso

### Paso 1: Crear datos de prueba y actualizar el entorno

```bash
npm run seed:postman
```

Este comando:

- Crea un usuario administrador con las credenciales correctas (admin@example.com/password)
- Crea registros de prueba para clientes, empleados, vehículos, baños químicos y servicios
- Actualiza el archivo de entorno de Postman con los IDs reales

### Paso 2: Ejecutar la colección de Postman

```bash
npm run run:postman
```

O bien, para ejecutar ambos pasos en secuencia:

```bash
npm run setup:postman
```

## Notas importantes

- Los errores 400 que persistan probablemente se deban a que los cuerpos de las solicitudes POST/PUT no contienen todos los campos requeridos. Revisa los errores específicos para más información.

- Para crear ejemplos de solicitud más realistas, puedes actualizar el generador de colecciones (`src/scripts/postman-generator/postman-generator.js`).

- Si cambias la estructura de la base de datos, es posible que necesites actualizar el script `create-postman-test-data.ts`.

## Customización

Para personalizar o mejorar la colección:

1. Modifica el script `create-postman-test-data.ts` para agregar más datos de prueba específicos para tus endpoints.

2. Actualiza el generador de colecciones para que cree ejemplos de solicitud más completos.

3. Considera agregar scripts de pre-request en Postman para configurar dinámicamente variables basadas en respuestas previas.
