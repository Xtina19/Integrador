/**
 * API Proveedores — adaptada exclusivamente a public/scriptdb
 * Tablas: Proveedor, Persona, TipoProveedor, Pais, Telefono, Persona_Tiene_Telefono
 * Contrato FE: id, code, name, contact, email, phone, country, supplierType, status, purchasesCount
 * Código: PROV###### auto en codigo_proveedor (inmutable en PUT)
 * No implementa Órdenes de Compra, Recepciones ni Facturas de Proveedores.
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { nextCodigoFromColumn } = require('../lib/codigoAuto');

const SELECT_PROVEEDOR = `
  SELECT
    pr.id_proveedor,
    pr.codigo_proveedor,
    pr.nombre_comercial,
    pr.estado,
    pr.es_internacional,
    pr.id_pais,
    pe.id_persona,
    pe.correo,
    pe.nombres AS contacto,
    tp.nombre AS tipo_nombre,
    pa.nombre AS pais_nombre,
    tel.telefono
  FROM Proveedor pr
  INNER JOIN Persona pe ON pe.id_persona = pr.id_persona
  INNER JOIN TipoProveedor tp ON tp.id_tipo_proveedor = pr.id_tipo_proveedor
  LEFT JOIN Pais pa ON pa.id_pais = pr.id_pais
  LEFT JOIN (
    SELECT
      ptt.id_persona,
      MIN(t.numero) AS telefono
    FROM Persona_Tiene_Telefono ptt
    INNER JOIN Telefono t ON t.id_telefono = ptt.id_telefono
    GROUP BY ptt.id_persona
  ) tel ON tel.id_persona = pe.id_persona
`;

function mapEstadoToFe(estado) {
  const e = String(estado || '').trim().toLowerCase();
  if (e === 'activo' || e === 'active') return 'active';
  return 'inactive';
}

function mapEstadoToDb(status) {
  const e = String(status || '').trim().toLowerCase();
  if (e === 'active' || e === 'activo') return 'Activo';
  return 'Inactivo';
}

function mapProveedor(row) {
  const country =
    row.pais_nombre ||
    (row.es_internacional ? 'Internacional' : 'República Dominicana');

  return {
    id: String(row.id_proveedor),
    code: row.codigo_proveedor,
    name: row.nombre_comercial || '',
    contact: row.contacto || '',
    email: row.correo || '',
    phone: row.telefono || '',
    country,
    supplierType: row.tipo_nombre || 'Distribuidor',
    status: mapEstadoToFe(row.estado),
    purchasesCount: 0,
  };
}

function fail(res, status, message) {
  return res.status(status).json({
    success: false,
    error: { code: status === 404 ? 'NOT_FOUND' : 'VALIDATION', message },
  });
}

async function fetchById(pool, id) {
  const result = await pool
    .request()
    .input('id', sql.Int, Number(id))
    .query(`${SELECT_PROVEEDOR} WHERE pr.id_proveedor = @id`);
  return result.recordset[0] || null;
}

async function resolveTipoProveedor(pool, supplierType) {
  const name = String(supplierType || 'Distribuidor').trim() || 'Distribuidor';
  const existing = await pool
    .request()
    .input('nombre', sql.VarChar(100), name)
    .query(`SELECT TOP 1 id_tipo_proveedor FROM TipoProveedor WHERE nombre = @nombre`);

  if (existing.recordset[0]) {
    return existing.recordset[0].id_tipo_proveedor;
  }

  const inserted = await pool
    .request()
    .input('nombre', sql.VarChar(100), name)
    .input('descripcion', sql.VarChar(255), name)
    .query(`
      INSERT INTO TipoProveedor (nombre, descripcion, estado)
      OUTPUT INSERTED.id_tipo_proveedor
      VALUES (@nombre, @descripcion, 'Activo')
    `);

  return inserted.recordset[0].id_tipo_proveedor;
}

/** Resuelve id_pais por nombre exacto (catálogo FE / tabla Pais existente). */
async function resolvePaisId(pool, countryName) {
  const nombre = String(countryName || '').trim();
  if (!nombre) return null;

  const existing = await pool
    .request()
    .input('nombre', sql.VarChar(100), nombre)
    .query(`SELECT TOP 1 id_pais FROM Pais WHERE nombre = @nombre`);

  if (existing.recordset[0]) {
    return existing.recordset[0].id_pais;
  }

  const isoBase = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .padEnd(3, 'X')
    .slice(0, 3);

  try {
    const inserted = await pool
      .request()
      .input('nombre', sql.VarChar(100), nombre)
      .input('iso', sql.Char(3), isoBase)
      .query(`
        INSERT INTO Pais (nombre, codigo_iso, estado)
        OUTPUT INSERTED.id_pais
        VALUES (@nombre, @iso, 'Activo')
      `);
    return inserted.recordset[0].id_pais;
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      const retry = await pool
        .request()
        .input('nombre', sql.VarChar(100), nombre)
        .query(`SELECT TOP 1 id_pais FROM Pais WHERE nombre = @nombre`);
      return retry.recordset[0]?.id_pais ?? null;
    }
    throw err;
  }
}

async function upsertTelefonoPersona(pool, idPersona, phone) {
  const numero = String(phone || '').trim();
  if (!numero) return;

  const existing = await pool
    .request()
    .input('idPersona', sql.Int, idPersona)
    .query(`
      SELECT TOP 1 t.id_telefono
      FROM Persona_Tiene_Telefono ptt
      INNER JOIN Telefono t ON t.id_telefono = ptt.id_telefono
      WHERE ptt.id_persona = @idPersona
      ORDER BY t.es_principal DESC, t.id_telefono ASC
    `);

  if (existing.recordset[0]) {
    await pool
      .request()
      .input('idTelefono', sql.Int, existing.recordset[0].id_telefono)
      .input('numero', sql.VarChar(20), numero)
      .query(`UPDATE Telefono SET numero = @numero WHERE id_telefono = @idTelefono`);
    return;
  }

  const tipo = await pool.request().query(`
    SELECT TOP 1 id_tipo_telefono
    FROM TipoTelefono
    WHERE nombre = 'Oficina' OR nombre = 'Móvil'
    ORDER BY CASE WHEN nombre = 'Oficina' THEN 0 ELSE 1 END
  `);
  const idTipo = tipo.recordset[0]?.id_tipo_telefono ?? 1;

  const inserted = await pool
    .request()
    .input('idTipo', sql.Int, idTipo)
    .input('numero', sql.VarChar(20), numero)
    .query(`
      INSERT INTO Telefono (id_tipo_telefono, numero, es_principal)
      OUTPUT INSERTED.id_telefono
      VALUES (@idTipo, @numero, 1)
    `);

  await pool
    .request()
    .input('idPersona', sql.Int, idPersona)
    .input('idTelefono', sql.Int, inserted.recordset[0].id_telefono)
    .query(`
      INSERT INTO Persona_Tiene_Telefono (id_persona, id_telefono)
      VALUES (@idPersona, @idTelefono)
    `);
}

async function countRelacionesProveedor(pool, idProveedor) {
  const result = await pool
    .request()
    .input('id', sql.Int, Number(idProveedor))
    .query(`
      SELECT COUNT(*) AS n
      FROM EventoTieneProveedorEvento
      WHERE id_proveedor = @id
    `);
  return Number(result.recordset[0]?.n) || 0;
}

function parseBody(body) {
  const b = body || {};
  return {
    name: String(b.name || b.nombre || b.nombre_comercial || '').trim(),
    contact: String(b.contact || b.contacto || '').trim(),
    email: String(b.email || b.correo || '').trim(),
    phone: String(b.phone || b.telefono || '').trim(),
    country: String(b.country || b.pais || '').trim(),
    supplierType: String(b.supplierType || b.type || b.tipo || 'Distribuidor').trim(),
    status: mapEstadoToDb(b.status || b.estado || 'active'),
  };
}

/** GET /api/proveedores — listar / buscar */
router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 100, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;
    const q = String(req.query.q || req.query.search || req.query.texto || '').trim();

    const request = pool.request();
    let where = ' WHERE 1=1 ';

    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += `
        AND (
          pr.codigo_proveedor LIKE @q
          OR pr.nombre_comercial LIKE @q
          OR ISNULL(pe.nombres, '') LIKE @q
          OR ISNULL(pe.correo, '') LIKE @q
          OR ISNULL(tel.telefono, '') LIKE @q
          OR ISNULL(pa.nombre, '') LIKE @q
        )`;
    }

    if (req.query.status || req.query.estado) {
      request.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status || req.query.estado));
      where += ' AND pr.estado = @estado ';
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);

    const countReq = pool.request();
    if (q) countReq.input('q', sql.NVarChar(200), `%${q}%`);
    if (req.query.status || req.query.estado) {
      countReq.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status || req.query.estado));
    }

    const countResult = await countReq.query(`
      SELECT COUNT(*) AS total
      FROM Proveedor pr
      INNER JOIN Persona pe ON pe.id_persona = pr.id_persona
      LEFT JOIN Pais pa ON pa.id_pais = pr.id_pais
      LEFT JOIN (
        SELECT ptt.id_persona, MIN(t.numero) AS telefono
        FROM Persona_Tiene_Telefono ptt
        INNER JOIN Telefono t ON t.id_telefono = ptt.id_telefono
        GROUP BY ptt.id_persona
      ) tel ON tel.id_persona = pe.id_persona
      WHERE 1=1
        ${q ? `AND (
          pr.codigo_proveedor LIKE @q
          OR pr.nombre_comercial LIKE @q
          OR ISNULL(pe.nombres, '') LIKE @q
          OR ISNULL(pe.correo, '') LIKE @q
          OR ISNULL(tel.telefono, '') LIKE @q
          OR ISNULL(pa.nombre, '') LIKE @q
        )` : ''}
        ${req.query.status || req.query.estado ? 'AND pr.estado = @estado' : ''}
    `);

    const total = countResult.recordset[0].total;
    const result = await request.query(`
      ${SELECT_PROVEEDOR}
      ${where}
      ORDER BY
        CASE WHEN pr.estado = 'Activo' THEN 0 ELSE 1 END,
        pr.nombre_comercial ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return res.json({
      success: true,
      data: result.recordset.map(mapProveedor),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[proveedores] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** GET /api/proveedores/:id */
router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Proveedor no encontrado');
    return res.json(mapProveedor(row));
  } catch (err) {
    console.error('[proveedores] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** POST /api/proveedores — crear (código auto PROV######) */
router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const data = parseBody(req.body);

    if (!data.name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!data.contact) return fail(res, 400, 'El contacto es obligatorio.');
    if (!data.email) return fail(res, 400, 'El correo es obligatorio.');
    if (!data.phone) return fail(res, 400, 'El teléfono es obligatorio.');
    if (!data.country) return fail(res, 400, 'El país es obligatorio.');

    const codigo = await nextCodigoFromColumn(pool, {
      table: 'Proveedor',
      column: 'codigo_proveedor',
      prefix: 'PROV',
    });
    const idTipo = await resolveTipoProveedor(pool, data.supplierType);
    const idPais = await resolvePaisId(pool, data.country);
    const esInternacional = data.country !== 'República Dominicana' ? 1 : 0;
    const docNumero = `PROV${Date.now()}`;

    const persona = await pool
      .request()
      .input('tipo', sql.VarChar(20), 'Jurídica')
      .input('nombres', sql.VarChar(100), data.contact)
      .input('razon', sql.VarChar(200), data.name)
      .input('docTipo', sql.VarChar(30), 'RNC')
      .input('docNum', sql.VarChar(50), docNumero)
      .input('correo', sql.VarChar(150), data.email)
      .input('estado', sql.VarChar(20), data.status)
      .query(`
        INSERT INTO Persona (
          tipo_persona, nombres, razon_social, documento_tipo, documento_numero, correo, estado
        )
        OUTPUT INSERTED.id_persona
        VALUES (@tipo, @nombres, @razon, @docTipo, @docNum, @correo, @estado)
      `);

    const idPersona = persona.recordset[0].id_persona;
    await upsertTelefonoPersona(pool, idPersona, data.phone);

    const inserted = await pool
      .request()
      .input('idPersona', sql.Int, idPersona)
      .input('idTipo', sql.Int, idTipo)
      .input('codigo', sql.VarChar(50), codigo)
      .input('nombre', sql.VarChar(200), data.name)
      .input('idPais', sql.Int, idPais)
      .input('internacional', sql.Bit, esInternacional)
      .input('estado', sql.VarChar(20), data.status)
      .query(`
        INSERT INTO Proveedor (
          id_persona, id_tipo_proveedor, codigo_proveedor, nombre_comercial,
          id_pais, es_internacional, estado
        )
        OUTPUT INSERTED.id_proveedor
        VALUES (@idPersona, @idTipo, @codigo, @nombre, @idPais, @internacional, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_proveedor);
    return res.status(201).json(mapProveedor(row));
  } catch (err) {
    console.error('[proveedores] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe un proveedor con datos duplicados.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PUT /api/proveedores/:id — editar (codigo_proveedor inmutable) */
router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Proveedor no encontrado');

    const body = req.body || {};
    const data = {
      name:
        body.name != null || body.nombre != null
          ? String(body.name || body.nombre || '').trim()
          : existing.nombre_comercial,
      contact:
        body.contact != null
          ? String(body.contact || '').trim()
          : existing.contacto || '',
      email:
        body.email != null || body.correo != null
          ? String(body.email || body.correo || '').trim()
          : existing.correo || '',
      phone:
        body.phone != null || body.telefono != null
          ? String(body.phone || body.telefono || '').trim()
          : existing.telefono || '',
      country:
        body.country != null || body.pais != null
          ? String(body.country || body.pais || '').trim()
          : existing.pais_nombre ||
            (existing.es_internacional ? 'Internacional' : 'República Dominicana'),
      supplierType:
        body.supplierType != null || body.type != null
          ? String(body.supplierType || body.type || '').trim()
          : existing.tipo_nombre,
      status:
        body.status != null || body.estado != null
          ? mapEstadoToDb(body.status || body.estado)
          : existing.estado,
    };

    if (!data.name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!data.contact) return fail(res, 400, 'El contacto es obligatorio.');
    if (!data.email) return fail(res, 400, 'El correo es obligatorio.');
    if (!data.phone) return fail(res, 400, 'El teléfono es obligatorio.');
    if (!data.country) return fail(res, 400, 'El país es obligatorio.');

    const idTipo = await resolveTipoProveedor(pool, data.supplierType);
    const idPais = await resolvePaisId(pool, data.country);
    const esInternacional = data.country !== 'República Dominicana' ? 1 : 0;

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('nombre', sql.VarChar(200), data.name)
      .input('idTipo', sql.Int, idTipo)
      .input('idPais', sql.Int, idPais)
      .input('internacional', sql.Bit, esInternacional)
      .input('estado', sql.VarChar(20), data.status)
      .query(`
        UPDATE Proveedor
        SET nombre_comercial = @nombre,
            id_tipo_proveedor = @idTipo,
            id_pais = @idPais,
            es_internacional = @internacional,
            estado = @estado
        WHERE id_proveedor = @id
      `);

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('nombres', sql.VarChar(100), data.contact)
      .input('correo', sql.VarChar(150), data.email)
      .input('razon', sql.VarChar(200), data.name)
      .input('estado', sql.VarChar(20), data.status)
      .query(`
        UPDATE pe
        SET pe.nombres = @nombres,
            pe.correo = @correo,
            pe.razon_social = @razon,
            pe.estado = @estado
        FROM Persona pe
        INNER JOIN Proveedor pr ON pr.id_persona = pe.id_persona
        WHERE pr.id_proveedor = @id
      `);

    await upsertTelefonoPersona(pool, existing.id_persona, data.phone);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapProveedor(row));
  } catch (err) {
    console.error('[proveedores] update', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** PATCH /api/proveedores/:id/estado */
router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Proveedor no encontrado');

    const estado = mapEstadoToDb(req.body?.status || req.body?.estado);

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), estado)
      .query(`UPDATE Proveedor SET estado = @estado WHERE id_proveedor = @id`);

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), estado)
      .query(`
        UPDATE pe
        SET pe.estado = @estado
        FROM Persona pe
        INNER JOIN Proveedor pr ON pr.id_persona = pe.id_persona
        WHERE pr.id_proveedor = @id
      `);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapProveedor(row));
  } catch (err) {
    console.error('[proveedores] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/**
 * DELETE /api/proveedores/:id
 * Borrado físico; si hay relaciones (eventos) → soft delete (Inactivo).
 */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Proveedor no encontrado');

    const linked = await countRelacionesProveedor(pool, req.params.id);
    if (linked > 0) {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .input('estado', sql.VarChar(20), 'Inactivo')
        .query(`UPDATE Proveedor SET estado = @estado WHERE id_proveedor = @id`);

      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .input('estado', sql.VarChar(20), 'Inactivo')
        .query(`
          UPDATE pe
          SET pe.estado = @estado
          FROM Persona pe
          INNER JOIN Proveedor pr ON pr.id_persona = pe.id_persona
          WHERE pr.id_proveedor = @id
        `);

      const row = await fetchById(pool, req.params.id);
      return res.json({
        success: true,
        data: { ...mapProveedor(row), deleted: false, softDeleted: true },
      });
    }

    try {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .query(`DELETE FROM Proveedor WHERE id_proveedor = @id`);

      return res.json({
        success: true,
        data: { id: String(req.params.id), deleted: true },
      });
    } catch (fkErr) {
      if (fkErr.number === 547) {
        await pool
          .request()
          .input('id', sql.Int, Number(req.params.id))
          .input('estado', sql.VarChar(20), 'Inactivo')
          .query(`UPDATE Proveedor SET estado = @estado WHERE id_proveedor = @id`);

        await pool
          .request()
          .input('id', sql.Int, Number(req.params.id))
          .input('estado', sql.VarChar(20), 'Inactivo')
          .query(`
            UPDATE pe
            SET pe.estado = @estado
            FROM Persona pe
            INNER JOIN Proveedor pr ON pr.id_persona = pe.id_persona
            WHERE pr.id_proveedor = @id
          `);

        const row = await fetchById(pool, req.params.id);
        return res.json({
          success: true,
          data: { ...mapProveedor(row), deleted: false, softDeleted: true },
        });
      }
      throw fkErr;
    }
  } catch (err) {
    console.error('[proveedores] delete', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
