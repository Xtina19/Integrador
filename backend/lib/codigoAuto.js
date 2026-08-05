/**
 * Generación de códigos de catálogo (política Productos).
 * Formato: PREFIX + número de 6 dígitos (ej. ALM000001).
 */
const { sql } = require('../db');

/**
 * @param {import('mssql').ConnectionPool} pool
 * @param {{ table: string, column: string, prefix: string, pad?: number }} opts
 */
async function nextCodigoFromColumn(pool, opts) {
  const pad = opts.pad ?? 6;
  const prefix = String(opts.prefix).toUpperCase();
  const table = opts.table;
  const column = opts.column;
  const allowed = new Set([
    'Producto.codigo_producto',
    'Almacen.codigo_almacen',
    'Proveedor.codigo_proveedor',
    'Sucursal.codigo_sucursal',
    'Usuario.nombre_usuario',
  ]);
  const key = `${table}.${column}`;
  if (!allowed.has(key)) {
    throw new Error(`Columna no permitida para código automático: ${key}`);
  }

  const result = await pool.request().query(`
    SELECT MAX(
      TRY_CAST(SUBSTRING(${column}, ${prefix.length + 1}, 20) AS INT)
    ) AS max_num
    FROM dbo.${table}
    WHERE ${column} LIKE '${prefix}[0-9]%'
      AND LEN(${column}) >= ${prefix.length + 1}
      AND TRY_CAST(SUBSTRING(${column}, ${prefix.length + 1}, 20) AS INT) IS NOT NULL
  `);
  const maxNum = Number(result.recordset[0]?.max_num || 0);
  return `${prefix}${String(maxNum + 1).padStart(pad, '0')}`;
}

/** Código derivado del IDENTITY (sin columna de código en BD). */
function codeFromId(prefix, id, pad = 6) {
  return `${String(prefix).toUpperCase()}${String(id).padStart(pad, '0')}`;
}

module.exports = {
  sql,
  nextCodigoFromColumn,
  codeFromId,
};
