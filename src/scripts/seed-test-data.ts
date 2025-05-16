import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { ResourceState } from '../common/enums/resource-states.enum';

dotenv.config();

/**
 * Script para insertar datos de prueba (empleados, vehículos, baños químicos y algunos clientes)
 */
async function seedTestData() {
  console.log('Iniciando proceso de inserción de datos de prueba...');

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
    // Inicializar la conexión
    await dataSource.initialize();
    console.log('Conexión a la base de datos establecida correctamente');

    // 1. Insertar clientes
    console.log('Insertando clientes...');
    const clientes = [
      {
        nombre_empresa: 'Constructora ABC',
        cuit: '30-71234567-0',
        direccion: 'Av. Principal 123, Buenos Aires',
        telefono: '011-4567-8901',
        email: 'contacto@constructoraabc.com',
        contacto_principal: 'Juan Pérez',
        estado: 'ACTIVO',
      },
      {
        nombre_empresa: 'Eventos del Sur',
        cuit: '30-71234568-1',
        direccion: 'Calle Sur 456, Córdoba',
        telefono: '0351-456-7890',
        email: 'info@eventosdelsur.com',
        contacto_principal: 'María González',
        estado: 'ACTIVO',
      },
      {
        nombre_empresa: 'Municipalidad de Rosario',
        cuit: '30-71234569-2',
        direccion: 'Plaza Central 789, Rosario',
        telefono: '0341-567-8901',
        email: 'obras@rosario.gob.ar',
        contacto_principal: 'Roberto Sánchez',
        estado: 'ACTIVO',
      },
      {
        nombre_empresa: 'Festival Nacional',
        cuit: '30-71234570-3',
        direccion: 'Parque Nacional s/n, Mendoza',
        telefono: '0261-678-9012',
        email: 'organizacion@festivalnacional.com',
        contacto_principal: 'Laura Rodríguez',
        estado: 'ACTIVO',
      },
      {
        nombre_empresa: 'Petrolera NOA',
        cuit: '30-71234571-4',
        direccion: 'Ruta 9 km 1234, Salta',
        telefono: '0387-789-0123',
        email: 'operaciones@petroleranoa.com',
        contacto_principal: 'Carlos Gómez',
        estado: 'ACTIVO',
      },
    ];

    let clientesInsertados = 0;
    for (const cliente of clientes) {
      // Verificar si el cliente ya existe
      const clienteExistente = await dataSource.query<any[]>(
        `SELECT * FROM clients WHERE cuit = $1`,
        [cliente.cuit],
      );

      if (!clienteExistente || clienteExistente.length === 0) {
        // Insertar solo si no existe
        await dataSource.query(
          `INSERT INTO clients (nombre_empresa, cuit, direccion, telefono, email, contacto_principal, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            cliente.nombre_empresa,
            cliente.cuit,
            cliente.direccion,
            cliente.telefono,
            cliente.email,
            cliente.contacto_principal,
            cliente.estado,
          ],
        );
        clientesInsertados++;
      } else {
        console.log(`Cliente con CUIT ${cliente.cuit} ya existe, omitiendo...`);
      }
    }
    console.log(`Clientes insertados: ${clientesInsertados}`);

    // 2. Insertar empleados
    console.log('Insertando empleados...');

    const fechaActual = new Date();
    const fechaContratacion = new Date(fechaActual);
    fechaContratacion.setFullYear(fechaContratacion.getFullYear() - 1);

    const empleados = [
      {
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        documento: '25789456',
        cargo: 'Conductor',
        telefono: '1145678901',
        email: 'carlos.rodriguez@example.com',
        fecha_contratacion: new Date(
          fechaContratacion.setMonth(fechaContratacion.getMonth() - 2),
        ),
        estado: ResourceState.DISPONIBLE,
      },
      {
        nombre: 'Laura',
        apellido: 'Gómez',
        documento: '30567891',
        cargo: 'Técnico',
        telefono: '1156789012',
        email: 'laura.gomez@example.com',
        fecha_contratacion: new Date(
          fechaContratacion.setMonth(fechaContratacion.getMonth() - 1),
        ),
        estado: ResourceState.DISPONIBLE,
      },
      {
        nombre: 'Martín',
        apellido: 'López',
        documento: '28901234',
        cargo: 'Operario',
        telefono: '1167890123',
        email: 'martin.lopez@example.com',
        fecha_contratacion: new Date(
          fechaContratacion.setMonth(fechaContratacion.getMonth() - 1),
        ),
        estado: ResourceState.DISPONIBLE,
      },
      {
        nombre: 'Ana',
        apellido: 'Martínez',
        documento: '33456789',
        cargo: 'Supervisor',
        telefono: '1178901234',
        email: 'ana.martinez@example.com',
        fecha_contratacion: new Date(
          fechaContratacion.setMonth(fechaContratacion.getMonth() - 1),
        ),
        estado: ResourceState.DISPONIBLE,
      },
      {
        nombre: 'Diego',
        apellido: 'Fernández',
        documento: '27890123',
        cargo: 'Conductor',
        telefono: '1189012345',
        email: 'diego.fernandez@example.com',
        fecha_contratacion: new Date(
          fechaContratacion.setMonth(fechaContratacion.getMonth() - 1),
        ),
        estado: ResourceState.DISPONIBLE,
      },
    ];

    let empleadosInsertados = 0;
    for (const empleado of empleados) {
      // Verificar si el empleado ya existe
      const empleadoExistente = await dataSource.query<any[]>(
        `SELECT * FROM employees WHERE documento = $1`,
        [empleado.documento],
      );

      if (!empleadoExistente || empleadoExistente.length === 0) {
        // Insertar solo si no existe
        await dataSource.query(
          `INSERT INTO employees (nombre, apellido, documento, cargo, telefono, email, fecha_contratacion, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            empleado.nombre,
            empleado.apellido,
            empleado.documento,
            empleado.cargo,
            empleado.telefono,
            empleado.email,
            empleado.fecha_contratacion,
            empleado.estado,
          ],
        );
        empleadosInsertados++;
      } else {
        console.log(
          `Empleado con documento ${empleado.documento} ya existe, omitiendo...`,
        );
      }
    }
    console.log(`Empleados insertados: ${empleadosInsertados}`);

    // 3. Insertar vehículos
    console.log('Insertando vehículos...');
    const vehiculos = [
      {
        placa: 'AA123BB',
        marca: 'Ford',
        modelo: 'F-100',
        año: 2020,
        tipo_cabina: 'simple',
        numero_interno: 'VH-001',
        fecha_vencimiento_vtv: new Date('2026-05-15'),
        fecha_vencimiento_seguro: new Date('2026-07-20'),
        es_externo: false,
        estado: ResourceState.DISPONIBLE,
      },
      {
        placa: 'AC456DD',
        marca: 'Chevrolet',
        modelo: 'S10',
        año: 2021,
        tipo_cabina: 'doble',
        numero_interno: 'VH-002',
        fecha_vencimiento_vtv: new Date('2026-06-10'),
        fecha_vencimiento_seguro: new Date('2026-08-15'),
        es_externo: false,
        estado: ResourceState.DISPONIBLE,
      },
      {
        placa: 'AD789FF',
        marca: 'Toyota',
        modelo: 'Hilux',
        año: 2022,
        tipo_cabina: 'doble',
        numero_interno: 'VH-003',
        fecha_vencimiento_vtv: new Date('2026-07-20'),
        fecha_vencimiento_seguro: new Date('2026-09-25'),
        es_externo: false,
        estado: ResourceState.DISPONIBLE,
      },
      {
        placa: 'AE012HH',
        marca: 'Volkswagen',
        modelo: 'Amarok',
        año: 2021,
        tipo_cabina: 'doble',
        numero_interno: 'VH-004',
        fecha_vencimiento_vtv: new Date('2026-08-05'),
        fecha_vencimiento_seguro: new Date('2026-10-10'),
        es_externo: false,
        estado: ResourceState.DISPONIBLE,
      },
      {
        placa: 'AF345JJ',
        marca: 'Fiat',
        modelo: 'Strada',
        año: 2023,
        tipo_cabina: 'simple',
        numero_interno: 'VH-005',
        fecha_vencimiento_vtv: new Date('2026-09-15'),
        fecha_vencimiento_seguro: new Date('2026-11-20'),
        es_externo: false,
        estado: ResourceState.DISPONIBLE,
      },
      {
        placa: 'AG678KK',
        marca: 'Nissan',
        modelo: 'Frontier',
        año: 2022,
        tipo_cabina: 'doble',
        numero_interno: null,
        fecha_vencimiento_vtv: new Date('2026-08-30'),
        fecha_vencimiento_seguro: new Date('2026-10-05'),
        es_externo: true,
        estado: ResourceState.DISPONIBLE,
      },
    ];

    let vehiculosInsertados = 0;
    for (const vehiculo of vehiculos) {
      // Verificar si el vehículo ya existe
      const vehiculoExistente = await dataSource.query<any[]>(
        `SELECT * FROM vehicles WHERE placa = $1`,
        [vehiculo.placa],
      );

      if (!vehiculoExistente || vehiculoExistente.length === 0) {
        // Insertar solo si no existe
        await dataSource.query(
          `INSERT INTO vehicles (placa, marca, modelo, año, tipo_cabina, numero_interno, fecha_vencimiento_vtv, fecha_vencimiento_seguro, es_externo, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            vehiculo.placa,
            vehiculo.marca,
            vehiculo.modelo,
            vehiculo.año,
            vehiculo.tipo_cabina,
            vehiculo.numero_interno,
            vehiculo.fecha_vencimiento_vtv,
            vehiculo.fecha_vencimiento_seguro,
            vehiculo.es_externo,
            vehiculo.estado,
          ],
        );
        vehiculosInsertados++;
      } else {
        console.log(
          `Vehículo con placa ${vehiculo.placa} ya existe, omitiendo...`,
        );
      }
    }
    console.log(`Vehículos insertados: ${vehiculosInsertados}`);

    // 4. Insertar baños químicos
    console.log('Insertando baños químicos...');
    const fechaAdquisicion = new Date();
    fechaAdquisicion.setFullYear(fechaAdquisicion.getFullYear() - 2);

    let banosInsertados = 0;
    for (let i = 1; i <= 10; i++) {
      // Rotar entre 3 modelos diferentes
      const modelo = ['Estándar', 'Premium', 'Portátil'][i % 3];

      // Crear una fecha de adquisición con diferencia de meses entre baños
      const fechaBano = new Date(fechaAdquisicion);
      fechaBano.setMonth(fechaBano.getMonth() + i);

      const codigoInterno = `BQ-${2022}-${i.toString().padStart(3, '0')}`;

      // Verificar si el baño ya existe
      const banoExistente = await dataSource.query<any[]>(
        `SELECT * FROM chemical_toilets WHERE codigo_interno = $1`,
        [codigoInterno],
      );

      if (!banoExistente || banoExistente.length === 0) {
        // Insertar solo si no existe
        await dataSource.query(
          `INSERT INTO chemical_toilets (codigo_interno, modelo, fecha_adquisicion, estado)
           VALUES ($1, $2, $3, $4)`,
          [
            codigoInterno,
            modelo,
            fechaBano.toISOString(),
            ResourceState.DISPONIBLE,
          ],
        );
        banosInsertados++;
      } else {
        console.log(
          `Baño con código interno ${codigoInterno} ya existe, omitiendo...`,
        );
      }
    }
    console.log(`Baños químicos insertados: ${banosInsertados}`);

    // Confirmar inserciones realizadas
    const clientesCount = await dataSource.query<{ count: string }[]>(
      'SELECT COUNT(*) FROM clients',
    );
    const empleadosCount = await dataSource.query<{ count: string }[]>(
      'SELECT COUNT(*) FROM employees',
    );
    const vehiculosCount = await dataSource.query<{ count: string }[]>(
      'SELECT COUNT(*) FROM vehicles',
    );
    const banosCount = await dataSource.query<{ count: string }[]>(
      'SELECT COUNT(*) FROM chemical_toilets',
    );

    console.log(
      `Total de clientes en la base de datos: ${clientesCount[0].count}`,
    );
    console.log(
      `Total de empleados en la base de datos: ${empleadosCount[0].count}`,
    );
    console.log(
      `Total de vehículos en la base de datos: ${vehiculosCount[0].count}`,
    );
    console.log(
      `Total de baños químicos en la base de datos: ${banosCount[0].count}`,
    );

    console.log('¡Datos de prueba insertados correctamente!');
  } catch (error) {
    console.error('Error al insertar datos de prueba:', error);
    throw error;
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar el script
seedTestData()
  .then(() => {
    console.log('Script finalizado correctamente');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error inesperado al ejecutar el script:', err);
    process.exit(1);
  });
