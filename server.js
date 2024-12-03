const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 3000;

// Middleware para habilitar CORS
app.use(cors());

// Middleware para manejar JSON
app.use(express.json());

// Ruta para obtener los últimos 3 comentarios
app.get('/comentarios', async (req, res) => {
    try {
      // Cambié la consulta para obtener todos los comentarios sin el LIMIT
      const result = await pool.query('SELECT * FROM public.comentario ORDER BY fecha DESC');
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  });

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Ruta para obtener todos los autores
app.get('/autores', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM public.autor');
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Error en el servidor');
    }
  });