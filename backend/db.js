const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env'),
  override: true,
});

const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,

  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERTIFICATE !== 'false',
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },

  connectionTimeout: 15000,
  requestTimeout: 30000,
};

console.log('Configuración SQL cargada:', {
  user: config.user,
  server: config.server,
  database: config.database,
});

let poolPromise = null;

async function getConnection() {
  if (!poolPromise) {
    const pool = new sql.ConnectionPool(config);

    pool.on('error', (err) => {
      console.error('Error interno del pool de SQL Server:', err);
      poolPromise = null;
    });

    poolPromise = pool.connect().catch((err) => {
      poolPromise = null;
      console.error('Error conectando con SQL Server:', err);
      throw err;
    });
  }

  return poolPromise;
}

async function closeConnection() {
  if (!poolPromise) return;

  try {
    const pool = await poolPromise;
    await pool.close();
  } finally {
    poolPromise = null;
  }
}

module.exports = {
  sql,
  getConnection,
  closeConnection,
};