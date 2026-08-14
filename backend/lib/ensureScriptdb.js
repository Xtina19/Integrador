/**
 * Aplica migraciones de public/scriptdb a una BD ya desplegada.
 * Tablas: OrdenCompra, FacturaInternacional, FacturaProveedores
 *
 * ALTER TABLE va en su propio batch (SQL Server no permite IF + ALTER juntos).
 */
let pending = null;

async function colLength(pool, table, column) {
  const r = await pool.request().query(`
    SELECT COL_LENGTH('${table}', '${column}') AS c
  `);
  return r.recordset[0]?.c ?? null;
}

async function objectExists(pool, name) {
  const r = await pool.request().query(`
    SELECT OBJECT_ID('${name}', 'U') AS id
  `);
  return r.recordset[0]?.id != null;
}

async function constraintExists(pool, name) {
  const r = await pool.request().query(`
    SELECT 1 AS ok FROM sys.foreign_keys WHERE name = '${name}'
  `);
  return Boolean(r.recordset[0]);
}

async function indexExists(pool, name) {
  const r = await pool.request().query(`
    SELECT 1 AS ok FROM sys.indexes WHERE name = '${name}'
  `);
  return Boolean(r.recordset[0]);
}

async function tryAlter(label, fn) {
  try {
    await fn();
  } catch (err) {
    console.warn('[scriptdb]', label, err.message);
  }
}

async function apply(pool) {
  await tryAlter('OrdenCompra.tipo_orden', async () => {
    if ((await colLength(pool, 'OrdenCompra', 'tipo_orden')) == null) {
      await pool.request().query(`
        ALTER TABLE OrdenCompra ADD tipo_orden VARCHAR(50) NOT NULL CONSTRAINT df_oc_tipo_orden DEFAULT 'Nacional'
      `);
    }
  });

  await tryAlter('OrdenCompra.tipo_orden seed', async () => {
    if ((await colLength(pool, 'OrdenCompra', 'tipo_orden')) != null) {
      await pool.request().query(`
        UPDATE OrdenCompra
        SET tipo_orden = 'Internacional'
        WHERE tipo_orden = 'Nacional'
          AND (observacion LIKE '%Import%' OR UPPER(codigo_orden) LIKE '%INT%')
      `);
    }
  });

  const hasFi = await objectExists(pool, 'FacturaInternacional');
  const hasFp = await objectExists(pool, 'FacturaProveedores');
  const hasOc = await objectExists(pool, 'OrdenCompra');

  await tryAlter('FacturaInternacional.id_orden_compra', async () => {
    if (hasFi && (await colLength(pool, 'FacturaInternacional', 'id_orden_compra')) == null) {
      await pool.request().query(`
        ALTER TABLE FacturaInternacional ADD id_orden_compra INT NULL
      `);
    }
  });

  await tryAlter('fk_fi_orden_compra', async () => {
    if (
      hasFi &&
      hasOc &&
      (await colLength(pool, 'FacturaInternacional', 'id_orden_compra')) != null &&
      !(await constraintExists(pool, 'fk_fi_orden_compra'))
    ) {
      await pool.request().query(`
        ALTER TABLE FacturaInternacional ADD CONSTRAINT fk_fi_orden_compra
          FOREIGN KEY (id_orden_compra) REFERENCES OrdenCompra(id_orden_compra)
      `);
    }
  });

  await tryAlter('uq_fi_orden_compra', async () => {
    if (
      hasFi &&
      (await colLength(pool, 'FacturaInternacional', 'id_orden_compra')) != null &&
      !(await indexExists(pool, 'uq_fi_orden_compra'))
    ) {
      await pool.request().query(`
        CREATE UNIQUE INDEX uq_fi_orden_compra ON FacturaInternacional(id_orden_compra)
        WHERE id_orden_compra IS NOT NULL
      `);
    }
  });

  await tryAlter('FacturaInternacional.id_factura_prov', async () => {
    if (hasFi && hasFp && (await colLength(pool, 'FacturaInternacional', 'id_factura_prov')) == null) {
      await pool.request().query(`
        ALTER TABLE FacturaInternacional ADD id_factura_prov INT NULL
      `);
    }
  });

  await tryAlter('fk_fi_factura_prov', async () => {
    if (
      hasFi &&
      hasFp &&
      (await colLength(pool, 'FacturaInternacional', 'id_factura_prov')) != null &&
      !(await constraintExists(pool, 'fk_fi_factura_prov'))
    ) {
      await pool.request().query(`
        ALTER TABLE FacturaInternacional ADD CONSTRAINT fk_fi_factura_prov
          FOREIGN KEY (id_factura_prov) REFERENCES FacturaProveedores(id_factura_prov)
      `);
    }
  });
}

async function ensureScriptdbCompras(pool) {
  if (!pending) {
    pending = apply(pool).catch((err) => {
      console.warn('[scriptdb] ensure', err.message);
      pending = Promise.resolve();
    });
  }
  return pending;
}

module.exports = { ensureScriptdbCompras };
