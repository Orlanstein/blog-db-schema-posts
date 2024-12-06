const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const { EmailClient } = require('@azure/communication-email');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del cliente de correo de Azure
const emailClient = new EmailClient(
  `endpoint=${process.env.AZURE_COMMUNICATION_ENDPOINT};accesskey=${process.env.AZURE_COMMUNICATION_API_KEY}`
);

// Configuración de la base de datos PostgreSQL
const pool = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Asegúrate de configurar esto según sea necesario
  },
});

// Conexión inicial a la base de datos
pool.connect()
  .then(() => console.log('Conexión a PostgreSQL exitosa'))
  .catch(err => {
    console.error('Error al conectar a PostgreSQL:', err.message);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Ruta para obtener comentarios recientes
app.get('/comentarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.comentario ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener los comentarios:', err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para obtener todos los autores
app.get('/autores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM public.autor');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener autores:', err.message);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para obtener todos los posts con datos del autor
app.get('/posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id_post, 
        p.titulo, 
        p.contenido, 
        p.fecha, 
        a.nombre AS nombre_autor 
      FROM public.post p
      INNER JOIN public.autor a ON p.id_autor = a.id_autor
      ORDER BY p.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener los posts:', err.message);
    res.status(500).send('Error en el servidor');
  }
});

//Cargar comentarios de un post
app.get('/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;

  try {
      const result = await pool.query(
          `SELECT contenido, fecha, 
                  (SELECT correo FROM public.autor WHERE id_autor = c.id_autor) AS email 
           FROM public.comentario c
           WHERE id_post = $1
           ORDER BY fecha ASC`, 
          [postId]
      );

      res.json(result.rows);
  } catch (err) {
      console.error('Error al obtener los comentarios:', err.message);
      res.status(500).send('Error en el servidor.');
  }
});


// Función para enviar correos utilizando Azure Communication Services
async function sendEmail(subject, content, toEmail) {
  try {
    const emailMessage = {
      senderAddress: process.env.AZURE_COMMUNICATION_SENDER_ADDRESS,
      content: {
        subject: subject,
        plainText: content,
        html: `<html><body><p>${content}</p></body></html>`,
      },
      recipients: {
        to: [{ address: toEmail }],
      },
    };

    const poller = await emailClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
    console.log(`Correo enviado a ${toEmail}: Estado - ${result.status}`);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
}

// Ruta para añadir un nuevo comentario
app.post('/comentarios', async (req, res) => {
  const { comentario, post_id, comentario_email } = req.body;

  // Validar datos de entrada
  if (!comentario || !post_id || !comentario_email) {
    return res.status(400).send('Faltan parámetros en la solicitud.');
  }

  try {
    // Insertar el comentario en la base de datos
    const result = await pool.query(
      `INSERT INTO comentario (contenido, id_post, fecha, id_autor) 
       VALUES ($1, $2, NOW(), NULL) 
       RETURNING *`,
      [comentario, post_id]
    );

    const nuevoComentario = result.rows[0];

    // Obtener información del autor del post
    const postResult = await pool.query(
      `SELECT a.correo AS autor_email, a.nombre AS autor_nombre, p.titulo AS post_titulo
       FROM public.post p
       INNER JOIN public.autor a ON p.id_autor = a.id_autor
       WHERE p.id_post = $1`,
      [post_id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).send('No se encontró el autor del post.');
    }

    const { autor_email, autor_nombre, post_titulo } = postResult.rows[0];

    // Enviar un correo al autor del post
    const subject = `Nuevo comentario en tu post "${post_titulo}"`;
    const content = `
      <p>Hola ${autor_nombre},</p>
      <p>Un nuevo comentario ha sido añadido a tu post:</p>
      <p><strong>Comentario:</strong> ${comentario}</p>
      <p><strong>Email del comentarista:</strong> ${comentario_email}</p>
      <p>Saludos,</p>
      <p>Tu equipo de Blog - ITSA - EquipoZombies</p>
    `;
    await sendEmail(subject, content, autor_email);

    console.log(`Correo enviado a ${autor_email}: Comentario añadido en el post "${post_titulo}"`);

    res.status(201).json(nuevoComentario); // Devolver el comentario añadido
  } catch (err) {
    console.error('Error al añadir el comentario y enviar correo:', err.message);
    res.status(500).send('Error en el servidor.');
  }
});



// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log('Conexión a la base de datos establecida correctamente.');
});

// Ruta para obtener los detalles de un post por ID
app.get('/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT 
                p.id_post, 
                p.titulo, 
                p.contenido, 
                p.fecha, 
                a.nombre AS nombre_autor 
            FROM public.post p
            INNER JOIN public.autor a ON p.id_autor = a.id_autor
            WHERE p.id_post = $1`, 
            [postId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error al obtener el post:', err.message);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});
