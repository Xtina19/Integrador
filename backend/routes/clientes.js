/**
 * API Clientes — adaptada exclusivamente a public/scriptdb
 * Tablas: Persona, Telefono, Persona_Tiene_Telefono
 * Clientes = Persona no vinculada a Usuario ni Proveedor.
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { codeFromId } = require('../lib/codigoAuto');
const {
  inferFeTipo,
  sqlWhereClienteSolo,
} = require('../lib/personaTipo');

const SELECT_CLIENTE = `
  SELECT
    p.*,
    tel.telefono
  FROM Persona p
  LEFT JOIN (
    SELECT
      ptt.id_persona,
      MIN(t.numero) AS telefono
    FROM Persona_Tiene_Telefono ptt
    INNER JOIN Telefono t ON t.id_telefono = ptt.id_telefono
    GROUP BY ptt.id_persona
  ) tel ON tel.id_persona = p.id_persona
`;

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function mapEstadoToFe(estado) {
  const e = normalizeText(estado);
  if (e === 'activo' || e === 'active') return 'activo';
  if (e === 'bloqueado' || e === 'blocked') return 'bloqueado';
  return 'inactivo';
}

function mapEstadoToDb(estado) {
  const e = normalizeText(estado);
  if (e === 'activo' || e === 'active') return 'Activo';
  if (e === 'bloqueado' || e === 'blocked') return 'Bloqueado';
  return 'Inactivo';
}

function mapDocumentoTipo(value) {
  const v = normalizeText(value);
  if (v.includes('rnc')) return 'rnc';
  if (v.includes('pasaporte') || v.includes('passport')) return 'pasaporte';
  return 'cedula';
}

function mapDocumentoTipoDb(value, tipoCliente) {
  const v = normalizeText(value);
  if (v === 'rnc') return 'RNC';
  if (v === 'pasaporte') return 'Pasaporte';
  const tipo = normalizeText(tipoCliente);
  if (tipo === 'empresa' || tipo === 'colegio' || tipo === 'universidad' || tipo === 'institucion') {
    return 'RNC';
  }
  return 'Cédula';
}

function mapFeTipoFromRow(row) {
  const t = normalizeText(row?.tipo_cliente);
  if (t === 'persona' || t === 'empresa' || t === 'colegio' || t === 'universidad' || t === 'institucion') {
    return t;
  }
  return inferFeTipo(row);
}

function mapSucursalPreferidaId(value) {
  const v = String(value || '').trim();
  if (!v || normalizeText(v) === 'sin preferencia') return '';
  if (normalizeText(v).includes('almacen central')) return 'suc-central';
  return v;
}

function isEmpresaFeTipo(tipoFe) {
  const t = String(tipoFe || '').toLowerCase();
  return t !== 'persona';
}

function mapDocumentoNumero(value) {
  const doc = String(value || '').trim();
  if (!doc || doc.startsWith('PEND-')) return '';
  return doc;
}

function mapCliente(row) {
  const tipoFe = mapFeTipoFromRow(row);
  const esPersona = tipoFe === 'persona';
  const nombre =
    (esPersona ? [row.nombres, row.apellidos].filter(Boolean).join(' ') : row.razon_social) ||
    row.razon_social ||
    '';
  return {
    id: String(row.id_persona),
    codigo: codeFromId('CLI', row.id_persona),
    nombre,
    tipo: tipoFe,
    documentoTipo: mapDocumentoTipo(row.documento_tipo),
    documento: mapDocumentoNumero(row.documento_numero),
    telefono: row.telefono || '',
    correo: row.correo || '',
    institucion: esPersona ? row.razon_social || '' : '',
    sucursalPreferidaId: mapSucursalPreferidaId(row.sucursal_preferida),
    estado: mapEstadoToFe(row.estado),
    observaciones: row.observaciones || '',
    fechaAlta: row.fecha_registro
      ? new Date(row.fecha_registro).toISOString()
      : new Date().toISOString(),
    creadoPor: 'Sistema',
    actualizadoEn: row.fecha_registro
      ? new Date(row.fecha_registro).toISOString()
      : new Date().toISOString(),
    actualizadoPor: 'Sistema',
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
    .query(`
      ${SELECT_CLIENTE}
      WHERE p.id_persona = @id
        AND ${sqlWhereClienteSolo('p')}
    `);
  return result.recordset[0] || null;
}

async function nextDocumentoPendiente(pool) {
  const result = await pool.request().query(`
    SELECT MAX(
      TRY_CAST(SUBSTRING(documento_numero, 6, 20) AS INT)
    ) AS max_num
    FROM Persona
    WHERE documento_numero LIKE 'PEND-[0-9]%'
  `);
  const next = Number(result.recordset[0]?.max_num || 0) + 1;
  return `PEND-${String(next).padStart(8, '0')}`;
}

async function resolveDocumentoNumero(pool, documento, tipoFe) {
  const doc = String(documento || '').trim();
  if (doc) return doc;
  if (isEmpresaFeTipo(tipoFe)) return null;
  return nextDocumentoPendiente(pool);
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
    WHERE nombre = 'Móvil' OR nombre = 'Oficina'
    ORDER BY CASE WHEN nombre = 'Móvil' THEN 0 ELSE 1 END
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

function parsePersonaFields(nombre, tipoFe, institucion) {
  const esPersona = String(tipoFe || '').toLowerCase() === 'persona';
  const parts = esPersona ? nombre.split(/\s+/).filter(Boolean) : [];
  return {
    nombres: esPersona ? parts[0] || null : null,
    apellidos: esPersona ? parts.slice(1).join(' ') || null : null,
    razon: esPersona ? institucion || null : nombre,
    tipoPersona: esPersona ? 'Natural' : 'Jurídica',
    tipoCliente: String(tipoFe || 'persona').toLowerCase(),
  };
}

function mapSucursalPreferidaDb(value) {
  const v = String(value || '').trim();
  if (!v) return 'Sin preferencia';
  if (v === 'suc-central') return 'Almacén Central';
  return v;
}

function buildSearchClause(alias = 'p') {
  return `
    ISNULL(${alias}.nombres, '') LIKE @q
    OR ISNULL(${alias}.apellidos, '') LIKE @q
    OR ISNULL(${alias}.razon_social, '') LIKE @q
    OR ${alias}.documento_numero LIKE @q
    OR ISNULL(${alias}.correo, '') LIKE @q
    OR ISNULL(tel.telefono, '') LIKE @q
  `;
}

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 100, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;
    const q = String(req.query.q || req.query.search || '').trim();
    const estadoFilter =
      req.query.estado != null || req.query.status != null
        ? mapEstadoToDb(req.query.estado || req.query.status)
        : null;

    const request = pool.request();
    const whereCliente = sqlWhereClienteSolo('p');
    let where = ` WHERE ${whereCliente} `;

    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += ` AND (${buildSearchClause('p')}) `;
    }
    if (estadoFilter) {
      request.input('estado', sql.VarChar(20), estadoFilter);
      where += ' AND p.estado = @estado ';
    }

    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);

    const countRequest = pool
      .request()
      .input('q', sql.NVarChar(200), q ? `%${q}%` : null)
      .input('estado', sql.VarChar(20), estadoFilter);

    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total
      FROM Persona p
      LEFT JOIN (
        SELECT ptt.id_persona, MIN(t.numero) AS telefono
        FROM Persona_Tiene_Telefono ptt
        INNER JOIN Telefono t ON t.id_telefono = ptt.id_telefono
        GROUP BY ptt.id_persona
      ) tel ON tel.id_persona = p.id_persona
      WHERE ${whereCliente}
        AND (@q IS NULL OR (${buildSearchClause('p')}))
        AND (@estado IS NULL OR p.estado = @estado)
    `);

    const total = countResult.recordset[0].total;
    const result = await request.query(`
      ${SELECT_CLIENTE}
      ${where}
      ORDER BY p.fecha_registro DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return res.json({
      success: true,
      data: result.recordset.map(mapCliente),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[clientes] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Cliente no encontrado');
    return res.json(mapCliente(row));
  } catch (err) {
    console.error('[clientes] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const nombre = String(body.nombre || body.name || '').trim();
    const tipoFe = String(body.tipo || 'persona').toLowerCase();
    const documentoTipo = mapDocumentoTipoDb(body.documentoTipo, tipoFe);
    const correo = String(body.correo || body.email || '').trim();
    const institucion = String(body.institucion || '').trim();
    const telefono = String(body.telefono || body.phone || '').trim();
    const estado = mapEstadoToDb(body.estado || body.status || 'activo');
    const sucursalPreferida = mapSucursalPreferidaDb(
      body.sucursalPreferidaId || body.sucursal_preferida || '',
    );
    const observaciones = String(body.observaciones || '').trim();

    if (!nombre) return fail(res, 400, 'El nombre es obligatorio.');

    const documento = await resolveDocumentoNumero(pool, body.documento || body.documento_numero, tipoFe);
    if (!documento) return fail(res, 400, 'El documento es obligatorio.');

    const { nombres, apellidos, razon, tipoPersona, tipoCliente } = parsePersonaFields(
      nombre,
      tipoFe,
      institucion,
    );

    const inserted = await pool
      .request()
      .input('tipo', sql.VarChar(20), tipoPersona)
      .input('nombres', sql.VarChar(100), nombres)
      .input('apellidos', sql.VarChar(100), apellidos)
      .input('razon', sql.VarChar(200), razon)
      .input('docTipo', sql.VarChar(30), documentoTipo)
      .input('docNum', sql.VarChar(50), documento)
      .input('correo', sql.VarChar(150), correo || null)
      .input('estado', sql.VarChar(20), estado)
      .input('tipoCliente', sql.VarChar(30), tipoCliente)
      .input('sucursal', sql.VarChar(100), sucursalPreferida || null)
      .input('obs', sql.VarChar(255), observaciones || null)
      .query(`
        INSERT INTO Persona (
          tipo_persona, nombres, apellidos, razon_social,
          documento_tipo, documento_numero, correo, estado,
          tipo_cliente, sucursal_preferida, observaciones
        )
        OUTPUT INSERTED.id_persona
        VALUES (
          @tipo, @nombres, @apellidos, @razon,
          @docTipo, @docNum, @correo, @estado,
          @tipoCliente, @sucursal, @obs
        )
      `);

    const idPersona = inserted.recordset[0].id_persona;
    await upsertTelefonoPersona(pool, idPersona, telefono);

    const row = await fetchById(pool, idPersona);
    return res.status(201).json(mapCliente(row));
  } catch (err) {
    console.error('[clientes] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe un cliente con ese documento.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Cliente no encontrado');

    const body = req.body || {};
    const nombre =
      body.nombre != null || body.name != null
        ? String(body.nombre || body.name || '').trim()
        : null;
    const tipoFe =
      body.tipo != null
        ? String(body.tipo).toLowerCase()
        : mapFeTipoFromRow(existing);
    const documentoRaw =
      body.documento != null ? String(body.documento || '').trim() : existing.documento_numero;
    const documento =
      documentoRaw && !String(documentoRaw).startsWith('PEND-')
        ? documentoRaw
        : body.documento != null
          ? await resolveDocumentoNumero(pool, body.documento, tipoFe)
          : existing.documento_numero;
    const documentoTipo = mapDocumentoTipoDb(
      body.documentoTipo != null ? body.documentoTipo : existing.documento_tipo,
      tipoFe,
    );
    const correo =
      body.correo != null || body.email != null
        ? String(body.correo || body.email || '').trim()
        : existing.correo || '';
    const institucion =
      body.institucion != null ? String(body.institucion || '').trim() : existing.razon_social || '';
    const telefono =
      body.telefono != null || body.phone != null
        ? String(body.telefono || body.phone || '').trim()
        : existing.telefono || '';
    const estado =
      body.estado != null || body.status != null
        ? mapEstadoToDb(body.estado || body.status)
        : existing.estado;
    const sucursalPreferida =
      body.sucursalPreferidaId != null || body.sucursal_preferida != null
        ? mapSucursalPreferidaDb(body.sucursalPreferidaId || body.sucursal_preferida || '')
        : existing.sucursal_preferida || 'Sin preferencia';
    const observaciones =
      body.observaciones != null
        ? String(body.observaciones || '').trim()
        : existing.observaciones || '';

    const finalNombre =
      nombre ||
      (tipoFe === 'persona'
        ? [existing.nombres, existing.apellidos].filter(Boolean).join(' ')
        : existing.razon_social) ||
      existing.razon_social ||
      '';
    if (!finalNombre) return fail(res, 400, 'El nombre es obligatorio.');
    if (!documento) return fail(res, 400, 'El documento es obligatorio.');

    const { nombres, apellidos, razon, tipoPersona, tipoCliente } = parsePersonaFields(
      finalNombre,
      tipoFe,
      institucion,
    );

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('tipo', sql.VarChar(20), tipoPersona)
      .input('nombres', sql.VarChar(100), nombres)
      .input('apellidos', sql.VarChar(100), apellidos)
      .input('razon', sql.VarChar(200), razon)
      .input('docTipo', sql.VarChar(30), documentoTipo)
      .input('docNum', sql.VarChar(50), documento)
      .input('correo', sql.VarChar(150), correo || null)
      .input('estado', sql.VarChar(20), estado)
      .input('tipoCliente', sql.VarChar(30), tipoCliente)
      .input('sucursal', sql.VarChar(100), sucursalPreferida || null)
      .input('obs', sql.VarChar(255), observaciones || null)
      .query(`
        UPDATE Persona
        SET tipo_persona = @tipo,
            nombres = @nombres,
            apellidos = @apellidos,
            razon_social = @razon,
            documento_tipo = @docTipo,
            documento_numero = @docNum,
            correo = @correo,
            estado = @estado,
            tipo_cliente = @tipoCliente,
            sucursal_preferida = @sucursal,
            observaciones = @obs
        WHERE id_persona = @id
      `);

    await upsertTelefonoPersona(pool, Number(req.params.id), telefono);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapCliente(row));
  } catch (err) {
    console.error('[clientes] update', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe un cliente con ese documento.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Cliente no encontrado');
    const estado = mapEstadoToDb(req.body?.estado || req.body?.status);
    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), estado)
      .query(`UPDATE Persona SET estado = @estado WHERE id_persona = @id`);
    const row = await fetchById(pool, req.params.id);
    return res.json(mapCliente(row));
  } catch (err) {
    console.error('[clientes] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** DELETE — borrado físico; si hay FKs relacionadas, desactiva (Inactivo). */
router.delete('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Cliente no encontrado');

    try {
      await pool
        .request()
        .input('id', sql.Int, Number(req.params.id))
        .query(`DELETE FROM Persona WHERE id_persona = @id`);
      return res.json({ success: true, data: { id: String(req.params.id), deleted: true } });
    } catch (fkErr) {
      if (fkErr.number === 547) {
        await pool
          .request()
          .input('id', sql.Int, Number(req.params.id))
          .input('estado', sql.VarChar(20), 'Inactivo')
          .query(`UPDATE Persona SET estado = @estado WHERE id_persona = @id`);
        const row = await fetchById(pool, req.params.id);
        return res.json({
          success: true,
          data: { ...mapCliente(row), deleted: false, softDeleted: true },
        });
      }
      throw fkErr;
    }
  } catch (err) {
    console.error('[clientes] delete', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
