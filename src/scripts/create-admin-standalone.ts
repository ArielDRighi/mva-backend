import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

async function createAdminUser() {
  console.log('Iniciando proceso de creación de usuario administrador...');

  // Crear una conexión directa a la base de datos
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'mva_db',
    // Cargar entidades desde los archivos JS compilados
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    // Inicializar la conexión
    await dataSource.initialize();
    console.log('Conexión a la base de datos establecida correctamente');

    // Usar SQL directo en lugar de repositorios TypeORM para evitar problemas de metadatos
    // Primero verificamos si el usuario admin ya existe
    const checkAdminQuery = `SELECT * FROM users WHERE nombre = 'admin' OR email = 'admin@mva.com'`;
    const existingAdmin: Array<{ nombre: string; email: string }> =
      await dataSource.query(checkAdminQuery);

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('¡Usuario administrador ya existe!');
      console.log(`Nombre: ${existingAdmin[0].nombre}`);
      console.log(`Email: ${existingAdmin[0].email}`);
      await dataSource.destroy();
      return;
    }

    // Crear el hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash('admin123', saltRounds);

    // Insertar el usuario admin directamente con SQL
    const insertAdminQuery = `
      INSERT INTO users (nombre, email, password_hash, estado, roles, empleado_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING usuario_id, nombre, email, estado
    `;

    interface AdminUser {
      usuario_id: string;
      nombre: string;
      email: string;
      estado: string;
    }

    const result = await dataSource.query<AdminUser[]>(insertAdminQuery, [
      'admin',
      'admin@mva.com',
      passwordHash,
      'ACTIVO',
      '{ADMIN}',
      null,
    ]);

    const adminUser = result[0];

    console.log('¡Usuario administrador creado exitosamente!');
    console.log('-------------------------------------');
    console.log('nombre: admin');
    console.log('Password: admin123');
    console.log('Email: admin@mva.com');
    console.log('Roles: ADMIN');
    console.log('ID:', adminUser.usuario_id);
    console.log('-------------------------------------');
    console.log(
      '¡IMPORTANTE! Recuerda cambiar esta contraseña después del primer inicio de sesión.',
    );
  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

createAdminUser()
  .then(() => {
    console.log('Script finalizado correctamente');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error inesperado al ejecutar el script:', err);
    process.exit(1);
  });
