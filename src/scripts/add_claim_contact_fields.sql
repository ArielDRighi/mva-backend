-- Migración: Agregar campos de contacto a la tabla de reclamos (claims)
-- Fecha: 2026-03-09
-- Descripción: Agrega campos para almacenar información de contacto del cliente que reporta el reclamo

-- Agregar columna para nombre del contacto
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS nombre_contacto VARCHAR(255) NULL;

-- Agregar columna para email del contacto
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS email_contacto VARCHAR(255) NULL;

-- Agregar columna para teléfono del contacto
ALTER TABLE claims 
ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(50) NULL;

-- Comentarios en las columnas (opcional, para documentación)
COMMENT ON COLUMN claims.nombre_contacto IS 'Nombre de la persona que reporta el reclamo';
COMMENT ON COLUMN claims.email_contacto IS 'Email de contacto para enviar confirmaciones y seguimiento';
COMMENT ON COLUMN claims.telefono_contacto IS 'Teléfono de contacto del cliente';

-- Verificar que las columnas fueron creadas correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'claims'
AND column_name IN ('nombre_contacto', 'email_contacto', 'telefono_contacto');
