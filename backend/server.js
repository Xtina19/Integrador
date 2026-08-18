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
const comprasRoutes = require('./routes/comprasScriptdb');
const importacionesRoutes = require('./routes/importacionesScriptdb');
const dashboardRoutes = require('./routes/dashboard');
const tiposFacturaRoutes = require('./routes/tiposFactura');
const { authPlaceholder } = require('./middlewares/authPlaceholder');
const { traceId } = require('./middlewares/traceId');
const { errorHandler } = require('./middlewares/errorHandler');
const { mountVentasDdd } = require('./bootstrap/mountVentas');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const { getConnection } = require('./db');
const { ensureScriptdbCompras } = require('./lib/ensureScriptdb');

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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tipos-factura', tiposFacturaRoutes);
app.use('/api/compras', traceId, authPlaceholder, comprasRoutes);
app.use('/api/v1/compras', traceId, authPlaceholder, comprasRoutes);
app.use('/api/importaciones', traceId, authPlaceholder, importacionesRoutes);
app.use('/api/v1/importaciones', traceId, authPlaceholder, importacionesRoutes);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    const pool = await getConnection();
    if (pool) await ensureScriptdbCompras(pool);
    await mountVentasDdd(app);
    app.use(errorHandler);
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
    server.on('error', (listenErr) => {
      if (listenErr && listenErr.code === 'EADDRINUSE') {
        console.error(`[Backend] El puerto ${PORT} ya está en uso. Cierre el otro proceso o cambie PORT en .env.`);
        process.exit(1);
      }
      console.error('[Backend] Error al escuchar:', listenErr);
      process.exit(1);
    });
  } catch (err) {
    console.error('[Backend] Error al iniciar:', err);
    process.exit(1);
  }
}

start();
