const sql = require('mssql');

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: String(process.env.DB_ENCRYPT || '').toLowerCase() === 'true',
    trustServerCertificate: String(process.env.DB_TRUST_CERTIFICATE || 'true').toLowerCase() !== 'false',
  }
};

async function getConnection() {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Error de conexión:', err);
  }
}

module.exports = { sql, getConnection };