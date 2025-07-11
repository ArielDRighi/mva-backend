import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

export const AppDataSource = new DataSource({
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
  synchronize: false, // Cambiar a false para usar migraciones
  logging: ['error', 'warn', 'migration'],
});
