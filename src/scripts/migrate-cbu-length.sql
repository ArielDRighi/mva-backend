-- Migración para actualizar la longitud del campo CBU de 20 a 22 caracteres
-- Fecha: 2025-06-23
-- Descripción: El CBU en Argentina debe tener exactamente 22 dígitos

BEGIN;

-- Alterar la columna CBU para aumentar su longitud de 20 a 22 caracteres
ALTER TABLE employees 
ALTER COLUMN "CBU" TYPE VARCHAR(22);

-- Verificar que el cambio se aplicó correctamente
-- Esta consulta debe devolver 22
SELECT character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'CBU';

COMMIT;
