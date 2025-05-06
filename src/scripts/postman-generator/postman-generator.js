const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuración
const config = {
  appName: 'MVA Backend',
  basePath: 'http://localhost:3000',
  apiPrefix: '/api', // Añadido prefijo de API
  srcPath: path.resolve(__dirname, '../../../src'),
  docsPath: path.resolve(__dirname, '../../../src/docs'),
  outputPath: path.resolve(
    __dirname,
    '../../../postman/mva-backend-collection.json',
  ),
  environmentPath: path.resolve(__dirname, '../../../postman/environment.json'),
};

// Función principal para generar la colección
async function generatePostmanCollection() {
  console.log('🔍 Escaneando archivos de controladores...');

  // Asegurar que la carpeta postman existe
  const outputDir = path.dirname(config.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Encontrar todos los controladores
  const controllers = findControllers();
  console.log(
    `✅ Se encontraron ${controllers.length} archivos de controladores.`,
  );

  // Analizar controladores para extraer endpoints
  const endpoints = extractEndpoints(controllers);
  console.log(`✅ Se encontraron ${endpoints.length} endpoints.`);

  // Buscar ejemplos en la documentación
  console.log('🔍 Buscando ejemplos en la documentación...');
  const docExamples = extractExamplesFromDocs();
  console.log(
    `✅ Se encontraron ${Object.keys(docExamples).length} ejemplos en la documentación.`,
  );

  // Generar colección de Postman
  const collection = buildPostmanCollection(endpoints, docExamples);

  // Guardar archivo de colección
  fs.writeFileSync(config.outputPath, JSON.stringify(collection, null, 2));
  console.log(`✅ Colección Postman guardada en ${config.outputPath}`);

  // Crear archivo de entorno
  createEnvironmentFile();

  console.log(
    '\n📝 Colección generada con éxito. Importe ambos archivos en la aplicación Postman.',
  );
}

// Encontrar todos los archivos de controladores
function findControllers() {
  // Usamos una ruta relativa desde la raíz del proyecto
  const pattern = 'src/**/*.controller.ts';
  return glob.sync(pattern);
}

// Extraer ejemplos de la documentación
function extractExamplesFromDocs() {
  const examples = {};
  const docFiles = glob.sync(`${config.docsPath}/**/*.md`);

  docFiles.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    const filename = path.basename(file, '.md').toLowerCase();

    // Extraer ejemplos de código JSON
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;

    while ((match = jsonRegex.exec(content)) !== null) {
      try {
        const jsonContent = match[1].trim();

        // Determinar si es un cuerpo de solicitud o respuesta
        const requestMatch = content
          .substring(Math.max(0, match.index - 500), match.index)
          .match(/POST|PUT|PATCH|DELETE.*?Content-Type: application\/json/);

        if (requestMatch) {
          // Determinar la ruta del endpoint
          const urlMatch = content
            .substring(Math.max(0, match.index - 500), match.index)
            .match(/\b(POST|PUT|PATCH|DELETE)\s+([^\s]+)/);

          if (urlMatch) {
            const method = urlMatch[1];
            let url = urlMatch[2].replace(/\/api\//, '/');

            // Estandarizar la ruta
            if (!url.startsWith('/')) {
              url = '/' + url;
            }

            // Crear clave única para el endpoint
            const key = `${method}:${url}`;

            // Añadir el ejemplo
            if (!examples[key]) {
              examples[key] = {
                body: jsonContent,
                contentType: 'application/json',
              };
            }
          }
        }
      } catch (e) {
        // Ignorar JSON inválido
        console.log(`❌ Error al parsear JSON en ${file}:`, e.message);
      }
    }

    // También buscar ejemplos HTTP completos
    const httpRegex = /```http\s*([\s\S]*?)\s*```/g;

    while ((match = httpRegex.exec(content)) !== null) {
      const httpContent = match[1].trim();
      const methodMatch = httpContent.match(
        /^(POST|PUT|PATCH|DELETE|GET)\s+([^\s]+)/,
      );

      if (methodMatch) {
        const method = methodMatch[1];
        let url = methodMatch[2].replace(/\/api\//, '/');

        // Estandarizar la ruta
        if (!url.startsWith('/')) {
          url = '/' + url;
        }

        // Extraer el cuerpo si existe
        const bodyMatch = httpContent.match(/\n\n([\s\S]+)$/);
        const body = bodyMatch ? bodyMatch[1].trim() : null;

        if (body) {
          const key = `${method}:${url}`;
          if (!examples[key]) {
            examples[key] = {
              body: body,
              contentType: httpContent.includes(
                'Content-Type: application/json',
              )
                ? 'application/json'
                : 'text/plain',
            };
          }
        }
      }
    }
  });

  return examples;
}

// Extraer información de endpoints de los controladores
function extractEndpoints(controllerFiles) {
  const endpoints = [];

  for (const filePath of controllerFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const controllerName = path.basename(filePath, '.controller.ts');

    // Extraer ruta base del controlador
    const controllerPathMatch = content.match(
      /@Controller\(['"]([^'"]*)['"]\)/,
    );
    const controllerPath = controllerPathMatch ? controllerPathMatch[1] : '';

    // Verificar si el controlador tiene autenticación
    const hasJwtGuard =
      content.includes('@UseGuards') && content.includes('JwtAuthGuard');

    // Buscar métodos con decoradores HTTP
    const httpMethodRegex =
      /@(Get|Post|Put|Delete|Patch)\(['"]?([^)]*?)['"]?\)/g;
    let match;

    while ((match = httpMethodRegex.exec(content)) !== null) {
      const httpMethod = match[1].toUpperCase();
      const methodPath = match[2].trim();

      // Buscar el nombre del método
      const methodNameMatch = content
        .substring(match.index)
        .match(/\)\s+(\w+)\(/);
      const methodName = methodNameMatch ? methodNameMatch[1] : 'unknown';

      // Determinar si el método tiene guardia específica
      const methodText = content.substring(match.index, match.index + 500);
      const methodHasGuard =
        methodText.includes('@UseGuards') &&
        methodText.includes('JwtAuthGuard');

      // Extraer roles si están definidos
      const rolesMatch = methodText.match(/@Roles\(([^)]+)\)/);
      const roles = rolesMatch
        ? rolesMatch[1]
            .split(',')
            .map((r) => r.trim().replace(/['"\s]/g, ''))
            .filter(Boolean)
        : [];

      // Construir ruta completa
      let fullPath = controllerPath;
      if (methodPath) {
        fullPath = `${controllerPath}/${methodPath}`.replace(/\/+/g, '/');
      }
      fullPath = `/${fullPath}`.replace(/\/+/g, '/');

      // Identificar parámetros
      const paramsMatch = fullPath.match(/:[a-zA-Z0-9_]+/g) || [];
      const params = paramsMatch.map((p) => p.substring(1));

      endpoints.push({
        controller: controllerName,
        path: fullPath,
        method: httpMethod,
        handlerName: methodName,
        parameters: params,
        roles: roles.length > 0 ? roles : undefined,
        authRequired: hasJwtGuard || methodHasGuard,
      });
    }
  }

  return endpoints;
}

// Construir colección de Postman
function buildPostmanCollection(endpoints, docExamples) {
  // Agrupar endpoints por controlador
  const controllerMap = {};

  endpoints.forEach((endpoint) => {
    if (!controllerMap[endpoint.controller]) {
      controllerMap[endpoint.controller] = [];
    }
    controllerMap[endpoint.controller].push(endpoint);
  });

  // Crear carpetas para cada controlador
  const folders = [];

  // Crear carpeta de autenticación primero (para que aparezca al principio)
  const authItems = [];

  // Añadir solicitud de login con script para almacenar el token
  authItems.push({
    name: 'Login (obtener token)',
    request: {
      method: 'POST',
      header: [
        {
          key: 'Content-Type',
          value: 'application/json',
          type: 'text',
        },
      ],
      url: {
        raw: '{{baseUrl}}/api/auth/login',
        host: ['{{baseUrl}}'],
        path: ['api', 'auth', 'login'],
      },
      body: {
        mode: 'raw',
        raw: JSON.stringify(
          {
            username: '{{adminEmail}}',
            password: '{{adminPassword}}',
          },
          null,
          2,
        ),
        options: {
          raw: {
            language: 'json',
          },
        },
      },
      description:
        'Inicia sesión y almacena automáticamente el token JWT para uso en solicitudes posteriores',
    },
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'var jsonData = pm.response.json();',
            'if (jsonData && jsonData.access_token) {',
            '    pm.environment.set("token", jsonData.access_token);',
            '    console.log("Token JWT almacenado correctamente");',
            '    pm.test("Token JWT almacenado correctamente", function() {',
            '        pm.expect(jsonData.access_token).to.be.a("string");',
            '    });',
            '} else {',
            '    console.error("No se pudo obtener el token JWT");',
            '    pm.test("Error al obtener el token JWT", function() {',
            '        pm.expect(jsonData).to.have.property("access_token");',
            '    });',
            '}',
          ],
          type: 'text/javascript',
        },
      },
    ],
  });

  // Añadir información de ayuda sobre autenticación
  authItems.push({
    name: 'Información de autenticación',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/api',
        host: ['{{baseUrl}}'],
        path: ['api'],
      },
      description: `# Cómo funciona la autenticación

1. Ejecuta la solicitud "Login (obtener token)" primero
2. Esto automáticamente almacenará el token JWT en la variable de entorno "token"
3. Todas las solicitudes protegidas utilizarán esta variable

## Credenciales de prueba

- Email: {{adminEmail}}
- Password: {{adminPassword}}

> Si las credenciales no funcionan, actualiza las variables de entorno con credenciales válidas.`,
    },
  });

  // Agregar la carpeta de autenticación al inicio
  folders.unshift({
    name: '🔐 Autenticación',
    description: 'Autenticación y gestión de tokens JWT',
    item: authItems,
  });

  // Agregar el resto de las carpetas de controladores
  Object.entries(controllerMap).forEach(([controller, endpointList]) => {
    // Excluir las rutas de autenticación que ya hemos añadido en la carpeta especial
    if (controller.toLowerCase() !== 'auth') {
      const requests = endpointList.map((endpoint) =>
        createPostmanRequest(endpoint, docExamples),
      );

      folders.push({
        name: formatControllerName(controller),
        item: requests,
        description: `Endpoints para ${controller}`,
      });
    }
  });

  // Crear colección completa
  return {
    info: {
      name: `${config.appName} API`,
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: `Colección generada automáticamente para ${config.appName}`,
      _postman_id: generateUUID(),
    },
    item: folders,
    variable: [
      {
        key: 'baseUrl',
        value: config.basePath,
        type: 'string',
      },
      {
        key: 'token',
        value: 'tu-token-jwt-aqui',
        type: 'string',
      },
      {
        key: 'adminEmail',
        value: 'admin@example.com',
        type: 'string',
      },
      {
        key: 'adminPassword',
        value: 'password',
        type: 'string',
      },
    ],
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{token}}',
          type: 'string',
        },
      ],
    },
  };
}

// Crear una solicitud de Postman para un endpoint
function createPostmanRequest(endpoint, docExamples) {
  // Crear encabezados
  const headers = [
    {
      key: 'Content-Type',
      value: 'application/json',
      type: 'text',
    },
  ];

  // Agregar encabezado de autorización si es necesario
  if (endpoint.authRequired) {
    headers.push({
      key: 'Authorization',
      value: 'Bearer {{token}}',
      type: 'text',
    });
  }

  // Preparar URL y parámetros de ruta
  let urlPath = endpoint.path;

  // Reemplazar parámetros de ruta con variables Postman
  (endpoint.parameters || []).forEach((param) => {
    urlPath = urlPath.replace(`:${param}`, `{{${param}}}`);
  });

  // Añadir el prefijo de API a la ruta
  const apiPath = `${config.apiPrefix}${urlPath}`;

  // Verificar si existe un ejemplo documentado para este endpoint
  const exampleKey = `${endpoint.method}:${endpoint.path}`;
  const docExample = docExamples[exampleKey];

  // Crear cuerpo de solicitud para métodos POST, PUT, PATCH
  let body;
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    let rawBody = docExample ? docExample.body : generateRequestBody(endpoint);

    body = {
      mode: 'raw',
      raw: rawBody,
      options: {
        raw: {
          language:
            docExample && docExample.contentType === 'application/json'
              ? 'json'
              : 'text',
        },
      },
    };
  }

  // Construir solicitud completa
  return {
    name: `${endpoint.method} ${endpoint.path}`,
    request: {
      method: endpoint.method,
      header: headers,
      url: {
        raw: `{{baseUrl}}${apiPath}`,
        host: ['{{baseUrl}}'],
        path: apiPath.split('/').filter(Boolean),
      },
      description: `${endpoint.handlerName} - ${endpoint.method} ${endpoint.path}`,
      ...(body && { body }),
    },
    response: [],
  };
}

// Generar un cuerpo de solicitud de ejemplo basado en el endpoint
function generateRequestBody(endpoint) {
  const controllerName = endpoint.controller.toLowerCase();
  let exampleBody = {};

  // Generar un cuerpo diferente según el controlador y el método
  if (controllerName.includes('auth')) {
    if (endpoint.path.includes('login')) {
      exampleBody = {
        username: 'usuario@ejemplo.com',
        password: 'contraseña',
      };
    } else if (endpoint.path.includes('register')) {
      exampleBody = {
        nombre: 'Nombre Usuario',
        email: 'usuario@ejemplo.com',
        password: 'contraseña',
        rol: 'USUARIO',
      };
    } else {
      exampleBody = {
        email: 'usuario@ejemplo.com',
      };
    }
  } else if (controllerName.includes('user')) {
    exampleBody = {
      nombre: 'Nombre Usuario',
      email: 'usuario@ejemplo.com',
      rol: 'USUARIO',
      estado: 'ACTIVO',
    };
  } else if (controllerName.includes('client')) {
    exampleBody = {
      nombre_empresa: 'Empresa Ejemplo',
      cuit: '30-12345678-9',
      direccion: 'Calle Ejemplo 123',
      telefono: '011-1234-5678',
      email: 'contacto@empresa.com',
      contacto_principal: 'Nombre Contacto',
    };
  } else if (controllerName.includes('service')) {
    exampleBody = {
      clienteId: 1,
      tipoServicio: 'TIPO_EJEMPLO',
      fechaServicio: '2025-05-10',
      ubicacion: 'Ubicación Ejemplo',
      notas: 'Notas de ejemplo',
      estado: 'PENDIENTE',
    };
  } else if (controllerName.includes('employee')) {
    exampleBody = {
      nombre: 'Nombre Empleado',
      apellido: 'Apellido Empleado',
      documento: '12345678',
      telefono: '011-1234-5678',
      email: 'empleado@ejemplo.com',
      direccion: 'Dirección Ejemplo',
      fecha_nacimiento: '1990-01-01',
    };
  } else if (
    controllerName.includes('chemical') ||
    controllerName.includes('toilet')
  ) {
    exampleBody = {
      serial: 'CHT-12345',
      modelo: 'Modelo Ejemplo',
      estado: 'DISPONIBLE',
      ubicacion: 'Ubicación Ejemplo',
    };
  } else if (controllerName.includes('vehicle')) {
    exampleBody = {
      placa: 'ABC123',
      marca: 'Marca Ejemplo',
      modelo: 'Modelo Ejemplo',
      anio: 2024,
      capacidadCarga: 1000,
      estado: 'DISPONIBLE',
    };
  } else if (controllerName.includes('maintenance')) {
    exampleBody = {
      fecha: '2025-05-10',
      descripcion: 'Descripción del mantenimiento',
      costo: 1000,
      tipo: 'TIPO_MANTENIMIENTO',
    };
  } else if (
    controllerName.includes('contractual') ||
    controllerName.includes('condition')
  ) {
    exampleBody = {
      clienteId: 1,
      tipo_de_contrato: 'TIPO_EJEMPLO',
      fecha_inicio: '2025-01-01',
      fecha_fin: '2025-12-31',
      monto: 10000,
      frecuencia_limpieza: 7,
    };
  } else {
    // Cuerpo genérico para otros controladores
    exampleBody = {
      id: 1,
      nombre: 'Ejemplo',
      descripcion: 'Descripción de ejemplo',
      fecha: '2025-05-05',
    };
  }

  return JSON.stringify(exampleBody, null, 2);
}

// Crear archivo de entorno
function createEnvironmentFile() {
  const environment = {
    id: generateUUID(),
    name: 'MVA Backend Environment',
    values: [
      {
        key: 'baseUrl',
        value: config.basePath,
        type: 'string',
        enabled: true,
      },
      {
        key: 'token',
        value: '',
        type: 'string',
        enabled: true,
      },
      {
        key: 'adminEmail',
        value: 'admin@example.com',
        type: 'string',
        enabled: true,
      },
      {
        key: 'adminPassword',
        value: 'password',
        type: 'string',
        enabled: true,
      },
    ],
    _postman_variable_scope: 'environment',
  };

  fs.writeFileSync(
    config.environmentPath,
    JSON.stringify(environment, null, 2),
  );
  console.log(`✅ Archivo de entorno guardado en ${config.environmentPath}`);
}

// Formatear nombre de controlador para la carpeta de Postman
function formatControllerName(controllerName) {
  return controllerName
    .replace(/Controller$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (str) => str.toUpperCase());
}

// Generar UUID simple para IDs de Postman
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Ejecutar la función principal
generatePostmanCollection().catch((error) => {
  console.error('❌ Error al generar la colección:', error);
  process.exit(1);
});
