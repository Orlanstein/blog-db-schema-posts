require('dotenv').config({ path: 'variables.env' }); // Especifica el archivo de variables
const { Pool } = require('pg');

// Configuración del pool con variables de entorno
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10), // Asegurar que sea un número
  ssl: {
    rejectUnauthorized: false, // Considera usar certificados válidos en producción
  },
});

// Probar la conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error conectando a la base de datos:', err.stack);
  }
  console.log('Conexión exitosa a PostgreSQL en Azure');
  release();
});

module.exports = pool;
