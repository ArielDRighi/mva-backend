import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

dotenv.config();

/**
 * Script para precargar datos de vehículos, clientes, sanitarios y empleados relacionados con usuarios
 */
async function preloadData() {
  console.log('Iniciando precarga de datos de ejemplo...');

  // Crear una conexión directa a la base de datos
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'mva_db',
    schema: process.env.DB_SCHEMA,
    entities: ['dist/**/*.entity.js'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Conexión a la base de datos establecida correctamente');

    // 1. Obtener usuarios existentes
    const users = await dataSource.query('SELECT * FROM users');
    if (!users || users.length === 0) {
      console.error(
        'No hay usuarios en la base de datos. Crea usuarios antes de precargar empleados.',
      );
      return;
    }

    // 2. Precarga de vehículos
    for (let i = 0; i < 30; i++) {
      await dataSource.query(
        `INSERT INTO vehicles (numero_interno, placa, marca, modelo, "año", tipo_cabina, fecha_vencimiento_vtv, fecha_vencimiento_seguro)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (placa) DO NOTHING`,
        [
          `V${(i + 1).toString().padStart(3, '0')}`,
          `ABC${(100 + i).toString()}`,
          ['Toyota', 'Ford', 'Chevrolet', 'Renault', 'Volkswagen'][i % 5],
          ['Hilux', 'Ranger', 'S10', 'Duster', 'Amarok'][i % 5],
          2015 + i,
          i % 2 === 0 ? 'simple' : 'doble',
          new Date(2025, i % 12, 1),
          new Date(2025, (i + 6) % 12, 15),
        ],
      );
    }
    console.log('Vehículos precargados.');

    // 3. Precarga de clientes
    for (let i = 0; i < 30; i++) {
      await dataSource.query(
        `INSERT INTO clients (nombre_empresa, email, cuit, direccion, telefono, contacto_principal, contacto_principal_telefono)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (cuit) DO NOTHING`,
        [
          `Empresa ${i + 1}`,
          `contacto${i + 1}@empresa.com`,
          `20${(100000000 + i * 12345).toString().padStart(9, '0')}`,
          `Calle ${i + 1} Nro ${100 + i}`,
          `11${40000000 + i * 1234}`,
          `Contacto ${i + 1}`,
          `11${50000000 + i * 2345}`,
        ],
      );
    }
    console.log('Clientes precargados.');

    // 4. Precarga de sanitarios
    for (let i = 0; i < 30; i++) {
      await dataSource.query(
        `INSERT INTO chemical_toilets (codigo_interno, modelo, fecha_adquisicion, estado)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (codigo_interno) DO NOTHING`,
        [
          `SANI${(i + 1).toString().padStart(3, '0')}`,
          ['Standard', 'Premium', 'Eco', 'Plus', 'Basic'][i % 5],
          new Date(2020 + (i % 5), (i * 2) % 12, 1 + i),
          'DISPONIBLE',
        ],
      );
    }
    console.log('Sanitarios precargados.');

    // 5. Precarga de empleados relacionados con usuarios
    const empleadosCount = Math.max(users.length, 30);
    for (let i = 0; i < empleadosCount; i++) {
      // Insertar empleado (agregando fecha_contratacion obligatoria)
      const empleadoRes = await dataSource.query(
        `INSERT INTO employees (
          nombre, apellido, documento, telefono, email, direccion, fecha_nacimiento, fecha_contratacion, cargo, estado, "CUIL", "CBU", "Legajo"
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (documento) DO NOTHING
         RETURNING empleado_id`,
        [
          `Empleado${i + 1}`,
          `Apellido${i + 1}`,
          `3000000${i + 1}`,
          `11${10000000 + i}`,
          `empleado${i + 1}@empresa.com`,
          `Calle ${i + 1}`,
          new Date(1990, i % 12, 1 + (i % 28)),
          new Date(2020, i % 12, 1 + (i % 28)), // fecha_contratacion ejemplo
          'Operario', // cargo obligatorio
          'DISPONIBLE', // estado obligatorio
          `20-3000000${i + 1}-9`, // CUIL ejemplo
          `00000000000000000000${(i + 1).toString().padStart(2, '0')}`.slice(
            -22,
          ), // CBU ejemplo
          1000 + i, // numero_legajo ejemplo
        ],
      );
      // Relacionar empleado con usuario si el usuario no tiene empleado_id
      const user = users[i % users.length];
      if (user && !user.empleado_id) {
        // Buscar el empleado recién insertado
        const empleadoId = empleadoRes[0]?.empleado_id;
        if (empleadoId) {
          await dataSource.query(
            `UPDATE users SET empleado_id = $1 WHERE usuario_id = $2`,
            [empleadoId, user.usuario_id],
          );
        }
      }
    }
    console.log('Empleados precargados y relacionados con usuarios.');

    console.log('Precarga completada.');
  } catch (error) {
    console.error('Error durante la precarga:', error);
    throw error;
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar el script
preloadData()
  .then(() => {
    console.log('Script finalizado correctamente');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error inesperado al ejecutar el script:', err);
    process.exit(1);
  });
