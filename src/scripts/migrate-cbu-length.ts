import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

async function migrateCbuLength() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'mva_db',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('📊 Conexión a la base de datos establecida');

    // Ejecutar la migración
    console.log('🔄 Iniciando migración para actualizar longitud del campo CBU...');
    
    await dataSource.query(`
      ALTER TABLE employees 
      ALTER COLUMN "CBU" TYPE VARCHAR(22);
    `);

    console.log('✅ Campo CBU actualizado a 22 caracteres');

    // Verificar el cambio
    const result = await dataSource.query(`
      SELECT character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'employees' 
      AND column_name = 'CBU';
    `);

    if (result[0]?.character_maximum_length === 22) {
      console.log('✅ Verificación exitosa: El campo CBU ahora acepta 22 caracteres');
    } else {
      console.log('❌ Error en la verificación. Longitud actual:', result[0]?.character_maximum_length);
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('🔐 Conexión cerrada');
  }
}

// Ejecutar la migración si se llama directamente
if (require.main === module) {
  migrateCbuLength()
    .then(() => {
      console.log('🎉 Migración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la migración:', error);
      process.exit(1);
    });
}

export { migrateCbuLength };
