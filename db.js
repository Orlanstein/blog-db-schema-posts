const { Pool } = require('pg');

// Configuración de la base de datos
const pool = new Pool({
  user: 'conexion_blog',      // Cambia por tu usuario de PostgreSQL
  host: 'zombies-tec1.postgres.database.azure.com',       // Cambia si no estás usando localhost
  database: 'blog',    // Nombre de tu base de datos
  password: 'blog1234', // Contraseña de tu usuario
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
