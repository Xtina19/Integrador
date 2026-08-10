/**
 * API Editoriales — public/scriptdb tabla Editorial
 * Contrato FE: id, code, name, country, contact, phone, email, contractType,
 * contractExpiry, status, productCount
 * Código: codigo_editorial en BD (EDT-###); fallback EDI###### por id.
 */
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { codeFromId } = require('../lib/codigoAuto');

const SELECT_EDITORIAL = `
  SELECT
    e.id_editorial,
    e.codigo_editorial,
    e.nombre,
    e.pais_origen,
    e.nombre_contacto,
    e.telefono,
    e.correo_contacto,
    e.sitio_web,
    e.tipo_contrato,
    e.vencimiento_contrato,
    e.estado,
    (
      SELECT COUNT(*)
      FROM Producto p
      WHERE p.id_editorial = e.id_editorial
    ) AS product_count
  FROM Editorial e
`;

function mapEstadoToFe(estado) {
  const v = String(estado || 'Activo').toLowerCase();
  return v === 'inactivo' || v === 'inactive' ? 'inactive' : 'active';
}

function codeEditorial(row) {
  if (row.codigo_editorial) return row.codigo_editorial;
  return codeFromId('EDI', row.id_editorial);
}

function formatDateFe(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function mapEditorial(row) {
  return {
    id: String(row.id_editorial),
    code: codeEditorial(row),
    name: row.nombre || '',
    country: row.pais_origen || '',
    contact: row.nombre_contacto || '',
    phone: row.telefono || '',
    email: row.correo_contacto || '',
    website: row.sitio_web || '',
    contractType: row.tipo_contrato || '',
    contractExpiry: formatDateFe(row.vencimiento_contrato),
    status: mapEstadoToFe(row.estado),
    productCount: Number(row.product_count) || 0,
  };
}

async function nextCodigoEditorial(pool) {
  const result = await pool.request().query(`
    SELECT MAX(TRY_CAST(SUBSTRING(codigo_editorial, 5, 20) AS INT)) AS max_num
    FROM Editorial
    WHERE codigo_editorial LIKE 'EDT-[0-9]%'
  `);
  const n = Number(result.recordset[0]?.max_num || 0) + 1;
  return `EDT-${String(n).padStart(3, '0')}`;
}

function parseBodyFields(body, existing = null) {
  const name =
    body.name != null || body.nombre != null
      ? String(body.name || body.nombre || '').trim()
      : existing?.nombre || '';
  const country =
    body.country != null || body.pais_origen != null
      ? String(body.country || body.pais_origen || body.pais || '').trim()
      : existing?.pais_origen || '';
  const contact =
    body.contact != null || body.nombre_contacto != null
      ? String(body.contact || body.nombre_contacto || '').trim()
      : existing?.nombre_contacto || '';
  const phone =
    body.phone != null || body.telefono != null
      ? String(body.phone || body.telefono || '').trim()
      : existing?.telefono || '';
  const email =
    body.email != null || body.correo != null || body.correo_contacto != null
      ? String(body.email || body.correo || body.correo_contacto || '').trim()
      : existing?.correo_contacto || '';
  const website =
    body.website != null || body.sitio_web != null
      ? String(body.website || body.sitio_web || '').trim()
      : existing?.sitio_web || '';
  const contractType =
    body.contractType != null || body.tipo_contrato != null
      ? String(body.contractType || body.tipo_contrato || '').trim()
      : existing?.tipo_contrato || '';
  const contractExpiry =
    body.contractExpiry != null || body.vencimiento_contrato != null
      ? String(body.contractExpiry || body.vencimiento_contrato || '').trim()
      : formatDateFe(existing?.vencimiento_contrato);
  const statusRaw =
    body.status != null || body.estado != null
      ? String(body.status || body.estado || '').trim()
      : existing?.estado || 'Activo';
  const status =
    statusRaw.toLowerCase() === 'inactive' || statusRaw.toLowerCase() === 'inactivo'
      ? 'Inactivo'
      : 'Activo';
  const codeRaw =
    body.code != null || body.codigo_editorial != null
      ? String(body.code || body.codigo_editorial || '').trim()
      : existing?.codigo_editorial || '';

  return { name, country, contact, phone, email, website, contractType, contractExpiry, status, codeRaw };
}

function searchWhereClause(alias = 'e') {
  return `
    AND (
      ${alias}.nombre LIKE @q
      OR ISNULL(${alias}.codigo_editorial, '') LIKE @q
      OR ISNULL(${alias}.pais_origen, '') LIKE @q
      OR ISNULL(${alias}.correo_contacto, '') LIKE @q
      OR ISNULL(${alias}.nombre_contacto, '') LIKE @q
    )`;
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
    .query(`${SELECT_EDITORIAL} WHERE e.id_editorial = @id`);
  return result.recordset[0] || null;
}

router.get('/dashboard', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      ${SELECT_EDITORIAL}
      ORDER BY product_count DESC, e.nombre
    `);
    const rows = result.recordset.map(mapEditorial);
    const withoutProducts = rows.filter((r) => r.productCount === 0).length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);
    const active = rows.filter((r) => r.status === 'active').length;
    const inactive = rows.filter((r) => r.status === 'inactive').length;
    const contractsExpired = rows.filter((r) => {
      if (!r.contractExpiry) return false;
      return new Date(r.contractExpiry) < today;
    }).length;
    const contractsExpiring = rows.filter((r) => {
      if (!r.contractExpiry) return false;
      const d = new Date(r.contractExpiry);
      return d >= today && d <= in30;
    }).length;
    const contractsActive = rows.filter((r) => {
      if (!r.contractExpiry) return r.status === 'active';
      return new Date(r.contractExpiry) >= today && r.status === 'active';
    }).length;
    const expiringSoon = rows
      .filter((r) => {
        if (!r.contractExpiry) return false;
        const d = new Date(r.contractExpiry);
        return d >= today && d <= in30;
      })
      .slice(0, 10)
      .map((r) => {
        const d = new Date(r.contractExpiry);
        const daysRemaining = Math.max(
          0,
          Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        );
        return {
          id: r.id,
          code: r.code,
          name: r.name,
          contractType: r.contractType,
          contractExpiry: r.contractExpiry,
          status: r.status,
          daysRemaining,
        };
      });
    return res.json({
      total: rows.length,
      active,
      inactive,
      withoutProducts,
      contractsExpired,
      contractsExpiring,
      contractsActive,
      topByProducts: rows[0]
        ? {
            id: rows[0].id,
            code: rows[0].code,
            name: rows[0].name,
            productCount: rows[0].productCount,
          }
        : null,
      productsByPublisher: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        status: r.status,
        productCount: r.productCount,
      })),
      expiringSoon,
    });
  } catch (err) {
    console.error('[editoriales] dashboard', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/productos', async (req, res) => {
  try {
    const pool = await getConnection();
    const publisherId =
      req.query.publisherId || req.query.editorialId || req.query.id_editorial;
    const q = String(req.query.q || req.query.search || '').trim();
    const request = pool.request();
    let where = ' WHERE 1=1 ';
    if (publisherId) {
      request.input('idEditorial', sql.Int, Number(publisherId));
      where += ' AND p.id_editorial = @idEditorial ';
    }
    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += `
        AND (
          p.titulo LIKE @q
          OR ISNULL(p.isbn, '') LIKE @q
          OR ISNULL(p.codigo_producto, '') LIKE @q
        )`;
    }
    const result = await request.query(`
      SELECT
        p.id_producto,
        p.codigo_producto,
        p.isbn,
        p.titulo,
        p.precio,
        p.estado,
        a.nombre AS autor_nombre,
        a.apellido AS autor_apellido,
        c.nombre_categoria,
        e.id_editorial,
        e.nombre AS editorial,
        (
          SELECT ISNULL(SUM(i.stock_actual), 0)
          FROM Inventario i
          WHERE i.id_producto = p.id_producto
        ) AS stock_total
      FROM Producto p
      INNER JOIN Autor a ON p.id_autor = a.id_autor
      INNER JOIN Editorial e ON p.id_editorial = e.id_editorial
      INNER JOIN CategoriaProducto c ON p.id_categoria = c.id_categoria
      ${where}
      ORDER BY p.titulo
    `);
    const data = result.recordset.map((row) => ({
      id: String(row.id_producto),
      code: row.codigo_producto,
      isbn: row.isbn || '',
      title: row.titulo,
      author: [row.autor_nombre, row.autor_apellido].filter(Boolean).join(' '),
      category: row.nombre_categoria || '',
      publisherId: String(row.id_editorial),
      publisher: row.editorial || '',
      stock: Number(row.stock_total) || 0,
      status: String(row.estado || '').toLowerCase() === 'activo' ? 'active' : 'inactive',
      price: Number(row.precio) || 0,
    }));
    return res.json(data);
  } catch (err) {
    console.error('[editoriales] productos', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/search', async (req, res) => {
  try {
    const pool = await getConnection();
    const q = String(req.query.q || req.query.texto || '').trim();
    const request = pool.request();
    let where = ' WHERE 1=1 ';
    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += searchWhereClause('e');
    }
    const result = await request.query(`${SELECT_EDITORIAL} ${where} ORDER BY e.nombre`);
    return res.json(result.recordset.map(mapEditorial));
  } catch (err) {
    console.error('[editoriales] search', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 100, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;
    const q = String(req.query.q || req.query.texto || req.query.search || '').trim();

    const request = pool.request();
    let where = ' WHERE 1=1 ';
    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += searchWhereClause('e');
    }
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);

    const countResult = await pool
      .request()
      .input('q', sql.NVarChar(200), q ? `%${q}%` : null)
      .query(`
        SELECT COUNT(*) AS total
        FROM Editorial e
        WHERE 1=1
          AND (@q IS NULL OR (
            e.nombre LIKE @q
            OR ISNULL(e.codigo_editorial, '') LIKE @q
            OR ISNULL(e.pais_origen, '') LIKE @q
            OR ISNULL(e.correo_contacto, '') LIKE @q
            OR ISNULL(e.nombre_contacto, '') LIKE @q
          ))
      `);

    const total = countResult.recordset[0].total;
    const result = await request.query(`
      ${SELECT_EDITORIAL}
      ${where}
      ORDER BY e.nombre
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    const data = result.recordset.map(mapEditorial);
    return res.json({ success: true, data, total, page, pageSize });
  } catch (err) {
    console.error('[editoriales] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Editorial no encontrada');
    return res.json(mapEditorial(row));
  } catch (err) {
    console.error('[editoriales] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const fields = parseBodyFields(body);

    if (!fields.name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!fields.country) return fail(res, 400, 'El país es obligatorio.');

    let codigo = fields.codeRaw;
    if (!codigo) codigo = await nextCodigoEditorial(pool);

    const inserted = await pool
      .request()
      .input('codigo', sql.VarChar(30), codigo)
      .input('nombre', sql.VarChar(150), fields.name)
      .input('pais', sql.VarChar(50), fields.country)
      .input('contacto', sql.VarChar(150), fields.contact || null)
      .input('telefono', sql.VarChar(20), fields.phone || null)
      .input('correo', sql.VarChar(100), fields.email || null)
      .input('sitio', sql.VarChar(200), fields.website || null)
      .input('tipo', sql.VarChar(100), fields.contractType || null)
      .input('venc', sql.Date, fields.contractExpiry || null)
      .input('estado', sql.VarChar(20), fields.status)
      .query(`
        INSERT INTO Editorial (
          codigo_editorial, nombre, pais_origen, nombre_contacto, telefono,
          correo_contacto, sitio_web, tipo_contrato, vencimiento_contrato, estado
        )
        OUTPUT INSERTED.id_editorial
        VALUES (@codigo, @nombre, @pais, @contacto, @telefono, @correo, @sitio, @tipo, @venc, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_editorial);
    return res.status(201).json(mapEditorial(row));
  } catch (err) {
    console.error('[editoriales] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe una editorial con ese código.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Editorial no encontrada');

    const body = req.body || {};
    const fields = parseBodyFields(body, existing);

    if (!fields.name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!fields.country) return fail(res, 400, 'El país es obligatorio.');

    const codigo = fields.codeRaw || existing.codigo_editorial || codeEditorial(existing);

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('codigo', sql.VarChar(30), codigo || null)
      .input('nombre', sql.VarChar(150), fields.name)
      .input('pais', sql.VarChar(50), fields.country)
      .input('contacto', sql.VarChar(150), fields.contact || null)
      .input('telefono', sql.VarChar(20), fields.phone || null)
      .input('correo', sql.VarChar(100), fields.email || null)
      .input('sitio', sql.VarChar(200), fields.website || null)
      .input('tipo', sql.VarChar(100), fields.contractType || null)
      .input('venc', sql.Date, fields.contractExpiry || null)
      .input('estado', sql.VarChar(20), fields.status)
      .query(`
        UPDATE Editorial
        SET codigo_editorial = @codigo,
            nombre = @nombre,
            pais_origen = @pais,
            nombre_contacto = @contacto,
            telefono = @telefono,
            correo_contacto = @correo,
            sitio_web = @sitio,
            tipo_contrato = @tipo,
            vencimiento_contrato = @venc,
            estado = @estado
        WHERE id_editorial = @id
      `);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapEditorial(row));
  } catch (err) {
    console.error('[editoriales] update', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe una editorial con ese código.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

/** Cambio de estado persistente en columna Editorial.estado */
router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Editorial no encontrada');
    const statusRaw = String(req.body?.status || req.body?.estado || 'active').toLowerCase();
    const estado = statusRaw === 'inactive' || statusRaw === 'inactivo' ? 'Inactivo' : 'Activo';

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), estado)
      .query(`UPDATE Editorial SET estado = @estado WHERE id_editorial = @id`);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapEditorial(row));
  } catch (err) {
    console.error('[editoriales] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
