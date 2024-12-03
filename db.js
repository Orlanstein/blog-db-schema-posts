const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'postgres',      // Cambia por tu usuario de PostgreSQL
  host: 'localhost',       // Cambia si no estás usando localhost
  database: 'paginadb',    // Nombre de tu base de datos
  password: 'Orla05Salo08', // Contraseña de tu usuario
  port: 5432,              // Puerto por defecto de PostgreSQL
});

// Probar la conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error conectando a la base de datos:', err.stack);
  }
  console.log('Conexión exitosa a PostgreSQL');
  release();
});

module.exports = pool;
