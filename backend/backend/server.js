const express = require('express');
const cors = require('cors');
require('dotenv').config();
const productosRoutes = require('./routes/productos');

const app = express();
app.use(cors());
app.use(express.json());

const { sql, getConnection } = require('./db');

// Endpoint de prueba para verificar que el servidor responde
app.get('/', (req, res) => {
  res.send('Backend funcionando 🚀');
});

// Endpoint de prueba para verificar la conexión a SQL Server
app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT GETDATE() AS fecha');
    res.json({ mensaje: 'Conexión exitosa', resultado: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/productos', productosRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

