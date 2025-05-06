# Generador de Colección Postman para MVA Backend

Esta herramienta permite generar automáticamente una colección de Postman a partir de los controladores de la aplicación NestJS MVA Backend.

## ¿Qué hace esta herramienta?

El generador de colección Postman analiza todos los controladores de la aplicación, extrae automáticamente los endpoints, métodos HTTP, parámetros y requisitos de autenticación, y crea una colección de Postman lista para usar. Esto elimina la necesidad de crear y mantener manualmente una colección de Postman para probar la API.

## Ubicación del Script

El script generador se encuentra en:

- `src/scripts/postman-generator/postman-generator.js`

## Requisitos

- Node.js instalado
- NPM instalado
- Dependencias: glob, newman (opcionales)

## Instalación

Asegúrate de tener instaladas las dependencias necesarias:

```bash
npm install --save-dev glob newman newman-reporter-html
```

## Uso

### Generar la Colección

Para generar la colección de Postman, ejecuta:

```bash
npm run generate:postman
```

Este comando analizará todos los controladores en la carpeta `src/` y generará:

- Una colección Postman en formato JSON (`postman/mva-backend-collection.json`)
- Un archivo de entorno (`postman/environment.json`)

### Ejecutar la Colección con Newman

Para ejecutar la colección generada usando Newman (sin necesidad de abrir la aplicación Postman):

```bash
npm run run:postman
```

> **Nota:** Para que las peticiones funcionen correctamente, la aplicación backend debe estar en ejecución (npm run start o npm run start:dev).

## Características

- Extracción automática de todos los endpoints de la API
- Detección de rutas, métodos HTTP y parámetros
- Generación de cuerpos de solicitud de ejemplo según el tipo de controlador
- Configuración automática de autenticación para endpoints protegidos
- Organización en carpetas por controlador
- Soporte para variables de entorno

## El archivo environment.json

El archivo `environment.json` es un componente fundamental de la colección Postman que contiene variables de entorno utilizadas por las peticiones. Este archivo incluye:

1. **baseUrl**: URL base para todas las peticiones (por defecto: http://localhost:3000)
2. **token**: Variable para almacenar el token JWT de autenticación

El archivo de entorno permite:

- Cambiar fácilmente entre diferentes entornos (desarrollo, pruebas, producción)
- Almacenar valores que se utilizan en múltiples peticiones
- Mantener separados los datos sensibles como tokens de la colección principal
- Compartir variables entre peticiones (por ejemplo, usar un ID obtenido en una petición en una petición posterior)

Para modificar las variables del entorno desde la aplicación Postman:

1. Haz clic en el ojo 👁️ en la esquina superior derecha
2. Haz clic en "Edit" junto al nombre del entorno
3. Modifica los valores según sea necesario

## Personalización

Puedes modificar la configuración en el archivo `src/scripts/postman-generator/postman-generator.js`:

- `appName`: Nombre de la aplicación
- `basePath`: URL base para las peticiones
- `srcPath`: Ruta a los archivos fuente
- `outputPath`: Ruta donde se guardará la colección
- `environmentPath`: Ruta donde se guardará el archivo de entorno

## Importar en Postman

Para usar la colección generada en la aplicación Postman:

1. Abre la aplicación Postman
2. Haz clic en "Import" en la esquina superior izquierda
3. Arrastra y suelta o navega y selecciona el archivo `postman/mva-backend-collection.json`
4. Haz clic en "Import" para completar la importación de la colección

Para importar el archivo de entorno:

1. Haz clic en el ícono de engranaje ⚙️ en la esquina superior derecha
2. Selecciona "Manage Environments"
3. Haz clic en "Import" y selecciona el archivo `postman/environment.json`
4. Una vez importado, selecciona el entorno "MVA Backend Environment" en el selector de entornos ubicado en la esquina superior derecha de la ventana principal

## Flujo de trabajo típico

1. Genera la colección de Postman: `npm run generate:postman`
2. Importa la colección y el entorno en Postman
3. Inicia la aplicación backend: `npm run start:dev`
4. Usa una solicitud de login para obtener un token JWT
5. Copia el token en la variable de entorno `token`
6. Ahora puedes probar cualquier endpoint protegido sin tener que copiar y pegar el token en cada solicitud

## Mantener la Colección Actualizada

Ejecuta el generador cada vez que:

- Se agreguen nuevos controladores
- Se modifiquen rutas existentes
- Se cambien métodos HTTP
- Se agreguen o eliminen parámetros

Esto asegurará que tu colección de Postman esté siempre sincronizada con el código actual de la API.

## Ventajas sobre la creación manual

- **Ahorro de tiempo**: No es necesario crear manualmente cada endpoint
- **Precisión**: Elimina errores humanos en la configuración de rutas y parámetros
- **Mantenimiento automático**: La colección siempre refleja el estado actual de la API
- **Documentación implícita**: Sirve como documentación interactiva de la API
- **Coherencia**: Todos los desarrolladores del equipo trabajan con la misma colección
