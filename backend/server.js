const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos');
const eventosRoutes = require('./routes/eventos');
const inventoryRoutes = require('./routes/inventario');
const almacenesRoutes = require('./routes/almacenes');

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
app.use('/api/eventos', eventosRoutes);
app.use('/api/inventario', inventoryRoutes);
app.use('/api/almacenes', almacenesRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

// server.on('error', (err) => {
//   console.error('Error iniciando el servidor:', err);
// });