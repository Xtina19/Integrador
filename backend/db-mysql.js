/**
 * Pool MySQL mínimo (mysql2) para rutas Express delgadas.
 * No reutiliza DB_USER/DB_PASSWORD del legacy mssql.
 *
 * Variables:
 *   DB_HOST / MYSQL_HOST (default localhost)
 *   DB_PORT / MYSQL_PORT (default 3306)
 *   DB_NAME / MYSQL_DATABASE (default librosys)
 *   MYSQL_USER / DB_MYSQL_USER (default root)
 *   MYSQL_PASSWORD / DB_MYSQL_PASSWORD (default '')
 */
const mysql = require('mysql2/promise');

let pool = null;

function getMysqlConfig() {
  return {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'librosys',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  };
}

function getMysqlPool() {
  if (!pool) {
    pool = mysql.createPool(getMysqlConfig());
  }
  return pool;
}

module.exports = { getMysqlPool, getMysqlConfig };
