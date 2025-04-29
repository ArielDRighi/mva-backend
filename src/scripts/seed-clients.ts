import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Script para insertar 100 clientes aleatorios en la base de datos
 */
async function seedClients() {
  console.log('Iniciando proceso de inserción de 100 clientes...');

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

    // Listas de valores aleatorios para generar clientes
    const nombresEmpresas = [
      'Constructora',
      'Eventos',
      'Servicios',
      'Desarrollos',
      'Comercial',
      'Industrias',
      'Grupo',
      'Consultora',
      'Logística',
      'Transportes',
      'Ingeniería',
      'Arquitectura',
      'Manufacturas',
      'Distribuidora',
      'Tecnología',
      'Alimentos',
      'Textil',
      'Metalúrgica',
      'Equipamiento',
      'Soluciones',
    ];

    const apellidosEmpresas = [
      'del Sur',
      'del Norte',
      'Argentina',
      'Nacional',
      'Internacional',
      'Regional',
      'del Este',
      'del Oeste',
      'Central',
      'Metropolitana',
      'Global',
      'Profesional',
      'Integral',
      'Express',
      'Premium',
      'Moderna',
      'Avanzada',
      'Especializada',
      'Corporativa',
      'Industrial',
    ];

    const sufijosEmpresas = [
      'S.A.',
      'S.R.L.',
      'S.A.S.',
      'S.C.',
      'S.C.S.',
      'S.C.A.',
      'S.H.',
      'S.E.',
      'S.C.I.',
      'S.G.R.',
    ];

    const calles = [
      'Av. Rivadavia',
      'Av. Corrientes',
      'Av. 9 de Julio',
      'Av. Santa Fe',
      'Av. Córdoba',
      'Calle Florida',
      'Av. Callao',
      'Av. de Mayo',
      'Av. Libertador',
      'Av. Pueyrredón',
      'Av. San Martín',
      'Av. Belgrano',
      'Av. Independencia',
      'Av. Juan B. Justo',
      'Av. Cabildo',
      'Av. Scalabrini Ortiz',
      'Av. Entre Ríos',
      'Av. Paseo Colón',
      'Av. Leandro N. Alem',
      'Av. Luis María Campos',
    ];

    const ciudades = [
      'Buenos Aires',
      'Córdoba',
      'Rosario',
      'Mendoza',
      'Tucumán',
      'La Plata',
      'Mar del Plata',
      'Salta',
      'Santa Fe',
      'San Juan',
      'Resistencia',
      'Neuquén',
      'Corrientes',
      'Posadas',
      'Paraná',
      'San Salvador de Jujuy',
      'Río Cuarto',
      'Bahía Blanca',
      'Formosa',
      'San Luis',
    ];

    const nombres = [
      'Juan',
      'María',
      'Carlos',
      'Laura',
      'Roberto',
      'Ana',
      'Martín',
      'Sofía',
      'Diego',
      'Valentina',
      'Pablo',
      'Lucía',
      'Federico',
      'Gabriela',
      'Javier',
      'Marcela',
      'Gustavo',
      'Alejandra',
      'Sebastián',
      'Paula',
    ];

    const apellidos = [
      'Pérez',
      'González',
      'Rodríguez',
      'Fernández',
      'López',
      'Martínez',
      'Sánchez',
      'Gómez',
      'Díaz',
      'Torres',
      'García',
      'Romero',
      'Álvarez',
      'Benítez',
      'Acosta',
      'Flores',
      'Medina',
      'Herrera',
      'Suárez',
      'Molina',
    ];

    console.log('Generando e insertando 100 clientes...');

    let clientesInsertados = 0;
    const insertadosCUITs = new Set();

    // Generar e insertar 100 clientes
    for (let i = 0; i < 100; i++) {
      // Generar datos aleatorios para el cliente
      const nombreIndex = Math.floor(Math.random() * nombresEmpresas.length);
      const apellidoIndex = Math.floor(
        Math.random() * apellidosEmpresas.length,
      );
      const sufijoIndex = Math.floor(Math.random() * sufijosEmpresas.length);

      // Generar un nombre de empresa aleatorio combinando elementos
      const nombreEmpresa = `${nombresEmpresas[nombreIndex]} ${apellidosEmpresas[apellidoIndex]} ${sufijosEmpresas[sufijoIndex]}`;

      // Generar un CUIT único
      let cuit;
      do {
        const prefijo = Math.floor(Math.random() * 10) + 30; // Entre 30 y 39
        const medio = Math.floor(Math.random() * 90000000) + 10000000; // 8 dígitos
        const verificador = Math.floor(Math.random() * 10); // 1 dígito
        cuit = `${prefijo}-${medio}-${verificador}`;
      } while (insertadosCUITs.has(cuit));

      insertadosCUITs.add(cuit);

      // Generar dirección aleatoria
      const calleIndex = Math.floor(Math.random() * calles.length);
      const ciudadIndex = Math.floor(Math.random() * ciudades.length);
      const numero = Math.floor(Math.random() * 5000) + 100;
      const direccion = `${calles[calleIndex]} ${numero}, ${ciudades[ciudadIndex]}`;

      // Generar teléfono aleatorio
      const caracteristica = Math.floor(Math.random() * 90) + 10; // 2 dígitos
      const telefono1 = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos
      const telefono2 = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos
      const telefono = `0${caracteristica}-${telefono1}-${telefono2}`;

      // Generar email aleatorio
      const dominio = Math.random() > 0.5 ? 'example.com' : 'empresa.com.ar';
      const nombreSinEspacios = nombresEmpresas[nombreIndex]
        .toLowerCase()
        .replace(/\s/g, '');
      const apellidoSinEspacios = apellidosEmpresas[apellidoIndex]
        .toLowerCase()
        .replace(/\s/g, '');
      const email = `contacto@${nombreSinEspacios}${apellidoSinEspacios}.${dominio}`;

      // Generar contacto principal aleatorio
      const nombreIndex2 = Math.floor(Math.random() * nombres.length);
      const apellidoIndex2 = Math.floor(Math.random() * apellidos.length);
      const contactoPrincipal = `${nombres[nombreIndex2]} ${apellidos[apellidoIndex2]}`;

      // Estado siempre ACTIVO para los nuevos clientes
      const estado = 'ACTIVO';

      // Verificar si el cliente con ese CUIT ya existe
      const clienteExistente = await dataSource.query<any[]>(
        `SELECT * FROM clients WHERE cuit = $1`,
        [cuit],
      );

      if (!clienteExistente || clienteExistente.length === 0) {
        // Insertar cliente
        await dataSource.query(
          `INSERT INTO clients (nombre_empresa, cuit, direccion, telefono, email, contacto_principal, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            nombreEmpresa,
            cuit,
            direccion,
            telefono,
            email,
            contactoPrincipal,
            estado,
          ],
        );
        clientesInsertados++;

        // Mostrar progreso cada 10 clientes
        if (clientesInsertados % 10 === 0) {
          console.log(`Progreso: ${clientesInsertados} clientes insertados`);
        }
      } else {
        console.log(`Cliente con CUIT ${cuit} ya existe, generando otro...`);
        // Decrementar i para intentar una vez más
        i--;
      }
    }

    // Confirmar inserciones realizadas
    const clientesCount = await dataSource.query<{ count: string }[]>(
      'SELECT COUNT(*) FROM clients',
    );

    console.log(`Clientes insertados en esta ejecución: ${clientesInsertados}`);
    console.log(
      `Total de clientes en la base de datos: ${clientesCount[0].count}`,
    );
    console.log('¡Clientes insertados correctamente!');
  } catch (error) {
    console.error('Error al insertar clientes:', error);
  } finally {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar el script
seedClients()
  .then(() => {
    console.log('Script finalizado correctamente');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error inesperado al ejecutar el script:', err);
    process.exit(1);
  });
