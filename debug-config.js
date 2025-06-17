require('dotenv').config();

console.log('=== DEBUG DE CONFIGURACIÓN ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_SCHEMA:', process.env.DB_SCHEMA);
console.log('synchronize será:', process.env.NODE_ENV !== 'production');
console.log('Ruta entities:', 'dist/**/*.entity.js');

// Verificar si existen archivos de entidades
const glob = require('glob');
const entities = glob.sync('dist/**/*.entity.js');
console.log('Entidades encontradas:', entities.length);
entities.forEach(entity => console.log('  -', entity));
