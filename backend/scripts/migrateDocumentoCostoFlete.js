/**
 * Migración DocumentoCostoFlete — public/scriptdb (bloque final).
 * Ejecutar una vez en BD desplegada: node scripts/migrateDocumentoCostoFlete.js
 */
require('dotenv').config();
const { getConnection } = require('../db');

async function main() {
  const pool = await getConnection();

  await pool.request().query(`
    IF OBJECT_ID('DocumentoCostoFlete', 'U') IS NULL
    BEGIN
      CREATE TABLE DocumentoCostoFlete (
        id_documento_flete INT PRIMARY KEY IDENTITY,
        id_embarque INT NOT NULL,
        codigo_documento VARCHAR(50) NOT NULL UNIQUE,
        numero_documento VARCHAR(100),
        tipo_documento VARCHAR(50) NOT NULL,
        concepto VARCHAR(150) NOT NULL,
        proveedor_servicio VARCHAR(150) NOT NULL,
        fecha_documento DATE NOT NULL,
        moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
        tasa_cambio DECIMAL(10, 4),
        monto DECIMAL(12, 2) NOT NULL,
        monto_local DECIMAL(12, 2),
        estado VARCHAR(50) NOT NULL DEFAULT 'Registrado',
        nombre_archivo VARCHAR(255),
        mime_type VARCHAR(100),
        contenido_archivo VARBINARY(MAX),
        observacion VARCHAR(255),
        fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_dcf_embarque FOREIGN KEY (id_embarque) REFERENCES Embarque(id_embarque)
      );
    END
  `);

  await pool.request().query(`
    IF OBJECT_ID('DocumentoCostoFlete', 'U') IS NOT NULL
       AND COL_LENGTH('DocumentoCostoFlete', 'mime_type') IS NULL
      ALTER TABLE DocumentoCostoFlete ADD mime_type VARCHAR(100) NULL;
  `);

  await pool.request().query(`
    IF OBJECT_ID('DocumentoCostoFlete', 'U') IS NOT NULL
       AND COL_LENGTH('DocumentoCostoFlete', 'contenido_archivo') IS NULL
      ALTER TABLE DocumentoCostoFlete ADD contenido_archivo VARBINARY(MAX) NULL;
  `);

  const check = await pool.request().query(`
    SELECT COUNT(*) AS n FROM DocumentoCostoFlete
  `);
  console.log('[migrate] DocumentoCostoFlete OK — filas:', check.recordset[0].n);
  process.exit(0);
}

main().catch((err) => {
  console.error('[migrate] Error:', err.message);
  process.exit(1);
});
