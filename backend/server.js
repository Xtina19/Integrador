const express = require('express');
const cors = require('cors');
require('dotenv').config();
const productosRoutes = require('./routes/productos');

const app = express();
app.use(cors());
app.use(express.json());

const { getConnection } = require('./db');

app.get('/', (req, res) => {
  res.send('Backend funcionando 🚀');
});

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

// Módulo Inventario (DDD / TypeScript) — conteos, transferencias, descartes, ajustes
const { register } = require('tsx/cjs/api');
register();
const {
  mountInventarioModule,
} = require('./src/modules/inventario/infrastructure/bootstrap/mountInventarioModule.ts');
mountInventarioModule(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
