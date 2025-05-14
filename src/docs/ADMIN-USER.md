# Creación de Usuario Administrador

Este documento explica cómo crear un usuario administrador en la base de datos utilizando el script proporcionado.

## Requisitos previos

1. Base de datos PostgreSQL configurada y en ejecución
2. Variables de entorno configuradas en un archivo `.env` en la raíz del proyecto:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=tu_contraseña
   DB_DATABASE=mva_db
   ```

## Pasos para crear el usuario administrador

### 1. Ejecutar el script

Desde la raíz del proyecto, ejecuta el siguiente comando:

```bash
npx ts-node -r tsconfig-paths/register src/scripts/create-admin-standalone.ts
```

Deberías ver una salida similar a esta:

```
Iniciando proceso de creación de usuario administrador...
Conexión a la base de datos establecida correctamente
¡Usuario administrador creado exitosamente!
-------------------------------------
Username: admin
Password: admin123
Email: admin@mva.com
Roles: ADMIN
ID: 1
-------------------------------------
¡IMPORTANTE! Recuerda cambiar esta contraseña después del primer inicio de sesión.
Conexión a la base de datos cerrada
Script finalizado correctamente
```

## Credenciales del usuario administrador

| Campo    | Valor         |
| -------- | ------------- |
| Username | admin         |
| Password | admin123      |
| Email    | admin@mva.com |
| Rol      | ADMIN         |

## Información importante

- **Seguridad**: Cambia la contraseña después del primer inicio de sesión
- **Uso único**: Este script está diseñado para crear el usuario administrador inicial
- **Verificación**: El script verifica si ya existe un usuario administrador para evitar duplicados
- **Problemas**: Si encuentras errores, verifica la configuración de la base de datos y las variables de entorno

## Uso del usuario administrador

El usuario administrador creado tiene acceso completo a todas las funcionalidades del sistema, incluyendo:

- Gestión de usuarios
- Asignación de roles
- Configuración del sistema
- Acceso a todas las funcionalidades restringidas

## Resolución de problemas

Si encuentras errores al ejecutar el script, verifica lo siguiente:

- La base de datos está activa y accesible
- Las credenciales de conexión son correctas
- El esquema de la tabla usuarios existe y tiene la estructura esperada
- Los módulos necesarios están instalados (bcrypt, dotenv, etc.)
.