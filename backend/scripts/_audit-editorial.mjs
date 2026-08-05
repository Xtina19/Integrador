import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();
const require = createRequire(import.meta.url);
const { getConnection } = require('../db.js');

const pool = await getConnection();
const cols = await pool.request().query(`
  SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='Editorial'
  ORDER BY ORDINAL_POSITION
`);
console.log(JSON.stringify(cols.recordset, null, 2));
const existing = await pool.request().query(`SELECT id_editorial, nombre FROM Editorial ORDER BY id_editorial`);
console.log('EXISTING:', existing.recordset.length, existing.recordset.slice(0, 5));
process.exit(0);
