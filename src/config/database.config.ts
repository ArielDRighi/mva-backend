import { registerAs } from '@nestjs/config';

export default registerAs('database', () => {
  const config = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_SCHEMA,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'migrations',
    // Cambiar synchronize basado en si estamos en producción o no
    synchronize:
      process.env.NODE_ENV !== 'production' &&
      process.env.USE_MIGRATIONS !== 'true',
    migrationsRun: process.env.USE_MIGRATIONS === 'true',
    logging: ['error', 'warn', 'info', 'log', 'schema'],
    dropSchema: false,

    // Usar configuración local para evitar conversiones automáticas
    timezone: 'local',
    extra: {
      // Deshabilitar conversiones automáticas para conservar fechas exactas
      parseInputDatesAsUTC: false,
      writeDatesAsUTC: false,
    },
  };

  console.log('=== CONFIGURACIÓN TYPEORM ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('synchronize:', config.synchronize);
  console.log('entities:', config.entities);
  console.log('===============================');

  return config;
});
