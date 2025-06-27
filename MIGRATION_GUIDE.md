# Guía de Migración: Agregando Datos Familiares a Empleados

## 🎯 Objetivo

Esta migración agrega la funcionalidad para almacenar datos familiares de los empleados sin perder datos existentes en producción.

## 📋 Datos Familiares Incluidos

- **Nombre**: Nombre del familiar
- **Apellido**: Apellido del familiar
- **Parentesco**: Relación familiar (cónyuge, hijo/a, padre, madre, hermano/a, etc.)
- **DNI**: Documento Nacional de Identidad
- **Fecha de nacimiento**: Fecha de nacimiento del familiar

## 🚀 Pasos para Aplicar en Producción

### 1. Preparación

```bash
# 1. Hacer backup de la base de datos
pg_dump -h [host] -U [usuario] -d [base_datos] > backup_antes_migracion.sql

# 2. Clonar y compilar la versión actualizada
git pull origin main
npm install
npm run build
```

### 2. Aplicar Migración

```bash
# Aplicar la migración
npm run migration:run
```

### 3. Verificación

```bash
# Verificar que la migración se aplicó correctamente
npm run migration:show
```

## 🔧 Configuración de Base de Datos

Para cambiar de `synchronize: true` a migraciones, actualizar variables de entorno:

```env
# Agregar esta variable para usar migraciones en producción
USE_MIGRATIONS=true
```

## 📊 Estructura de la Nueva Tabla

```sql
CREATE TABLE "family_members" (
    "id" SERIAL NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "apellido" character varying(100) NOT NULL,
    "parentesco" character varying(50) NOT NULL,
    "dni" character varying(20) NOT NULL,
    "fecha_nacimiento" date NOT NULL,
    "empleadoEmpleadoId" integer,
    CONSTRAINT "PK_family_members_id" PRIMARY KEY ("id"),
    CONSTRAINT "FK_family_members_empleado"
        FOREIGN KEY ("empleadoEmpleadoId")
        REFERENCES "employees"("empleado_id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
```

## 🌐 Nuevos Endpoints API

### Agregar Familiar

```http
POST /employees/{id}/family-members
Authorization: Bearer [token]
Content-Type: application/json

{
  "nombre": "María",
  "apellido": "García",
  "parentesco": "esposa",
  "dni": "12345678",
  "fecha_nacimiento": "1985-03-15"
}
```

### Obtener Familiares

```http
GET /employees/{id}/family-members
Authorization: Bearer [token]
```

### Actualizar Familiar

```http
PUT /employees/family-members/{familyId}
Authorization: Bearer [token]
Content-Type: application/json

{
  "nombre": "María Elena",
  "apellido": "García López"
}
```

### Eliminar Familiar

```http
DELETE /employees/family-members/{familyId}
Authorization: Bearer [token]
```

## 🔄 Rollback (Si es necesario)

En caso de problemas, revertir la migración:

```bash
# Revertir la última migración
npm run migration:revert

# Restaurar backup si es necesario
psql -h [host] -U [usuario] -d [base_datos] < backup_antes_migracion.sql
```

## ✅ Validación Post-Migración

1. **Verificar tabla creada**:

   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_name = 'family_members';
   ```

2. **Verificar foreign key**:

   ```sql
   SELECT constraint_name FROM information_schema.table_constraints
   WHERE table_name = 'family_members' AND constraint_type = 'FOREIGN KEY';
   ```

3. **Probar endpoints** usando los ejemplos de API arriba

## 🎯 Consideraciones Importantes

- ✅ **No hay pérdida de datos**: La migración solo agrega nuevas tablas
- ✅ **Backward compatible**: Los empleados existentes siguen funcionando
- ✅ **Cascading deletes**: Si se elimina un empleado, sus familiares se eliminan automáticamente
- ✅ **Validaciones**: Todos los campos familiares tienen validaciones apropiadas

## 🛡️ Seguridad

- Solo usuarios con roles `ADMIN` o `SUPERVISOR` pueden gestionar datos familiares
- Validación de datos en el backend usando class-validator
- Foreign keys garantizan integridad referencial

## 📞 Soporte

Si hay problemas durante la migración:

1. No aplicar más cambios
2. Revisar logs de la aplicación
3. Verificar conexión a base de datos
4. Contactar al equipo de desarrollo con detalles del error
