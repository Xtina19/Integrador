require('dotenv').config();

const express = require('express');
const cors = require('cors');

const monedasRoutes = require('./routes/monedas');
const categoriasRoutes = require('./routes/categorias');
const editorialesRoutes = require('./routes/editoriales');
const productosRoutes = require('./routes/productos');
const almacenesRoutes = require('./routes/almacenes');
const proveedoresRoutes = require('./routes/proveedores');
const clientesRoutes = require('./routes/clientes');
const rolesRoutes = require('./routes/roles');
const usuariosRoutes = require('./routes/usuarios');
const formasPagoRoutes = require('./routes/formasPago');
const tasasCambioRoutes = require('./routes/tasasCambio');
const eventosRoutes = require('./routes/eventos');
const autoresRoutes = require('./routes/autores');
const inventoryRoutes = require('./routes/inventario');
const { mountVentasDdd } = require('./bootstrap/mountVentas');

const app = express();
app.use(cors());
app.use(express.json());

const { getConnection } = require('./db');

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

app.get('/api/test-db', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT GETDATE() AS fecha');
    res.json({ mensaje: 'Conexion exitosa', resultado: result.recordset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/monedas', monedasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/editoriales', editorialesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/almacenes', almacenesRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/formas-pago', formasPagoRoutes);
app.use('/api/tasas-cambio', tasasCambioRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/autores', autoresRoutes);
app.use('/api/inventario', inventoryRoutes);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await mountVentasDdd(app);
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  } catch (err) {
    console.error('[Backend] Error al iniciar:', err);
    process.exit(1);
  }
}

start();
