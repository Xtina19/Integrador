const express = require('express');
const cors = require('cors');
require('dotenv').config();

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

app.use('/api/monedas', require('./routes/monedas.routes'));
app.use('/api/categorias', require('./routes/categorias.routes'));
app.use('/api/editoriales', require('./routes/editoriales.routes'));
app.use('/api/productos', require('./routes/productos.routes'));
app.use('/api/almacenes', require('./routes/almacenes.routes'));
app.use('/api/proveedores', require('./routes/proveedores.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/formas-pago', require('./routes/formasPago.routes'));
app.use('/api/tasas-cambio', require('./routes/tasasCambio.routes'));
app.use('/api/productos-legacy', require('./routes/productos'));

// Módulo Inventario (DDD / TypeScript) — conteos, transferencias, descartes, ajustes
const { register } = require('tsx/cjs/api');
register();
const {
  mountInventarioModule,
} = require('./src/modules/inventario/infrastructure/bootstrap/mountInventarioModule.ts');
const inventarioComposition = mountInventarioModule(app);

const {
  mountVentasModule,
} = require('./src/modules/ventas/infrastructure/bootstrap/mountVentasModule.ts');
mountVentasModule(app, inventarioComposition);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
