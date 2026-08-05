/**
 * Formas de pago adicionales Joselito — INSERT en dbo.FormaPago
 * Tabla real: FormaPago (public/scriptdb). NOTA_CREDITO no se inserta aquí.
 */
import dotenv from 'dotenv';
import { createRequire } from 'module';

dotenv.config();
const require = createRequire(import.meta.url);
const { getConnection, sql } = require('../db.js');

const ROWS = [
  ['CHEQUE', 'cheque', 'Cheque', 'Activo'],
  ['PAYPAL', 'paypal', 'PayPal', 'Activo'],
  ['PAGO_MOVIL', 'pago_movil', 'Pago Móvil', 'Activo'],
  ['PUNTOS', 'puntos', 'Puntos / Programa de Lealtad', 'Activo'],
  ['CRIPTO', 'cripto', 'Criptomoneda', 'Activo'],
  ['FINANCIAMIENTO', 'financiamiento', 'Financiamiento / Crédito Institucional', 'Activo'],
];

const pool = await getConnection();
if (!pool) {
  console.error('No se pudo conectar a SQL Server.');
  process.exit(1);
}

await pool.request().query(`
  IF OBJECT_ID('dbo.FormaPago', 'U') IS NULL
  CREATE TABLE dbo.FormaPago (
    id_forma_pago INT PRIMARY KEY IDENTITY,
    codigo VARCHAR(30) NOT NULL,
    slug VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo',
    fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_FormaPago_codigo UNIQUE (codigo),
    CONSTRAINT UQ_FormaPago_slug UNIQUE (slug)
  );
`);

let inserted = 0;
let updated = 0;

for (const [codigo, slug, nombre, estado] of ROWS) {
  const existing = await pool
    .request()
    .input('codigo', sql.VarChar(30), codigo)
    .query(`SELECT id_forma_pago FROM FormaPago WHERE codigo = @codigo`);

  if (existing.recordset[0]) {
    await pool
      .request()
      .input('codigo', sql.VarChar(30), codigo)
      .input('slug', sql.VarChar(30), slug)
      .input('nombre', sql.NVarChar(100), nombre)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        UPDATE FormaPago
        SET slug = @slug, nombre = @nombre, estado = @estado
        WHERE codigo = @codigo
      `);
    updated += 1;
    console.log(`UPDATE ${codigo}`);
  } else {
    await pool
      .request()
      .input('codigo', sql.VarChar(30), codigo)
      .input('slug', sql.VarChar(30), slug)
      .input('nombre', sql.NVarChar(100), nombre)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO FormaPago (codigo, slug, nombre, estado)
        VALUES (@codigo, @slug, @nombre, @estado)
      `);
    inserted += 1;
    console.log(`INSERT ${codigo}`);
  }
}

const list = await pool.request().query(`
  SELECT codigo, slug, nombre, estado
  FROM FormaPago
  ORDER BY id_forma_pago ASC
`);

console.log('\n--- Catálogo FormaPago ---');
console.table(list.recordset);
console.log(`\nInsertadas: ${inserted}, actualizadas: ${updated}, total: ${list.recordset.length}`);
process.exit(0);
