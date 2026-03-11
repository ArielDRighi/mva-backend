import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function addSurveyFields() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Iniciar transacción
      await queryRunner.startTransaction();

      // Agregar columna 'servicios' si no existe
      await queryRunner.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'satisfaction_survey' AND column_name = 'servicios'
          ) THEN
            ALTER TABLE satisfaction_survey 
            ADD COLUMN servicios text;
            RAISE NOTICE 'Columna servicios agregada';
          ELSE
            RAISE NOTICE 'Columna servicios ya existe';
          END IF;
        END $$;
      `);

      // Agregar columna 'calificacion_servicio' si no existe
      await queryRunner.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'satisfaction_survey' AND column_name = 'calificacion_servicio'
          ) THEN
            ALTER TABLE satisfaction_survey 
            ADD COLUMN calificacion_servicio integer;
            RAISE NOTICE 'Columna calificacion_servicio agregada';
          ELSE
            RAISE NOTICE 'Columna calificacion_servicio ya existe';
          END IF;
        END $$;
      `);

      // Hacer 'lugar_proyecto' nullable si no lo es
      await queryRunner.query(`
        DO $$ 
        BEGIN
          ALTER TABLE satisfaction_survey 
          ALTER COLUMN lugar_proyecto DROP NOT NULL;
          RAISE NOTICE 'Columna lugar_proyecto ahora es nullable';
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'lugar_proyecto ya es nullable o no existe';
        END $$;
      `);

      // Commit de la transacción
      await queryRunner.commitTransaction();
      console.log('✅ Migración completada exitosamente');
    } catch (error) {
      // Rollback en caso de error
      await queryRunner.rollbackTransaction();
      console.error('❌ Error durante la migración:', error);
      throw error;
    } finally {
      // Liberar el query runner
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('✅ Conexión cerrada');
  }
}

// Ejecutar la migración
addSurveyFields()
  .then(() => {
    console.log('✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });
