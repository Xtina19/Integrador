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
    contractType: row.tipo_contrato || '',
    contractExpiry: formatDateFe(row.vencimiento_contrato),
    status: mapEstadoToFe(row.estado),
    productCount: Number(row.product_count) || 0,
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
    .query(`${SELECT_EDITORIAL} WHERE e.id_editorial = @id`);
  return result.recordset[0] || null;
}

router.get('/dashboard', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        e.id_editorial,
        e.codigo_editorial,
        e.nombre,
        e.estado,
        e.vencimiento_contrato,
        (SELECT COUNT(*) FROM Producto p WHERE p.id_editorial = e.id_editorial) AS product_count
      FROM Editorial e
      ORDER BY product_count DESC, e.nombre
    `);
    const rows = result.recordset.map(mapEditorial);
    const withoutProducts = rows.filter((r) => r.productCount === 0).length;
    const today = new Date();
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
      .map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        contractExpiry: r.contractExpiry,
        status: r.status,
      }));
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
    const publisherId = req.query.publisherId || req.query.id_editorial;
    const request = pool.request();
    let where = ' WHERE 1=1 ';
    if (publisherId) {
      request.input('idEditorial', sql.Int, Number(publisherId));
      where += ' AND p.id_editorial = @idEditorial ';
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
        e.nombre AS editorial
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
      stock: 0,
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
      where += `
        AND (
          e.nombre LIKE @q
          OR ISNULL(e.pais_origen, '') LIKE @q
          OR ISNULL(e.correo_contacto, '') LIKE @q
        )`;
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
      where += `
        AND (
          e.nombre LIKE @q
          OR ISNULL(e.pais_origen, '') LIKE @q
          OR ISNULL(e.correo_contacto, '') LIKE @q
        )`;
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
            OR ISNULL(e.pais_origen, '') LIKE @q
            OR ISNULL(e.correo_contacto, '') LIKE @q
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
    const name = String(body.name || body.nombre || '').trim();
    const country = String(body.country || body.pais_origen || body.pais || '').trim();
    const contact = String(body.contact || body.nombre_contacto || '').trim();
    const phone = String(body.phone || body.telefono || '').trim();
    const email = String(body.email || body.correo || body.correo_contacto || '').trim();
    const contractType = String(body.contractType || body.tipo_contrato || '').trim();
    const contractExpiry = String(body.contractExpiry || body.vencimiento_contrato || '').trim();
    const statusRaw = String(body.status || body.estado || 'Activo').trim();
    const status = statusRaw.toLowerCase() === 'inactive' || statusRaw.toLowerCase() === 'inactivo'
      ? 'Inactivo'
      : 'Activo';

    if (!name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!country) return fail(res, 400, 'El país es obligatorio.');

    const inserted = await pool
      .request()
      .input('nombre', sql.VarChar(150), name)
      .input('pais', sql.VarChar(50), country)
      .input('contacto', sql.VarChar(150), contact || null)
      .input('telefono', sql.VarChar(20), phone || null)
      .input('correo', sql.VarChar(100), email || null)
      .input('tipo', sql.VarChar(100), contractType || null)
      .input('venc', sql.Date, contractExpiry || null)
      .input('estado', sql.VarChar(20), status)
      .query(`
        INSERT INTO Editorial (
          nombre, pais_origen, nombre_contacto, telefono, correo_contacto,
          tipo_contrato, vencimiento_contrato, estado
        )
        OUTPUT INSERTED.id_editorial
        VALUES (@nombre, @pais, @contacto, @telefono, @correo, @tipo, @venc, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_editorial);
    return res.status(201).json(mapEditorial(row));
  } catch (err) {
    console.error('[editoriales] create', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Editorial no encontrada');

    const body = req.body || {};
    const name =
      body.name != null || body.nombre != null
        ? String(body.name || body.nombre || '').trim()
        : existing.nombre;
    const country =
      body.country != null || body.pais_origen != null
        ? String(body.country || body.pais_origen || '').trim()
        : existing.pais_origen || '';
    const phone =
      body.phone != null || body.telefono != null
        ? String(body.phone || body.telefono || '').trim()
        : existing.telefono || '';
    const email =
      body.email != null || body.correo != null || body.correo_contacto != null
        ? String(body.email || body.correo || body.correo_contacto || '').trim()
        : existing.correo_contacto || '';
    const contact =
      body.contact != null || body.nombre_contacto != null
        ? String(body.contact || body.nombre_contacto || '').trim()
        : existing.nombre_contacto || '';
    const contractType =
      body.contractType != null || body.tipo_contrato != null
        ? String(body.contractType || body.tipo_contrato || '').trim()
        : existing.tipo_contrato || '';
    const contractExpiry =
      body.contractExpiry != null || body.vencimiento_contrato != null
        ? String(body.contractExpiry || body.vencimiento_contrato || '').trim()
        : formatDateFe(existing.vencimiento_contrato);
    const statusRaw =
      body.status != null || body.estado != null
        ? String(body.status || body.estado || '').trim()
        : existing.estado || 'Activo';
    const status =
      statusRaw.toLowerCase() === 'inactive' || statusRaw.toLowerCase() === 'inactivo'
        ? 'Inactivo'
        : 'Activo';

    if (!name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!country) return fail(res, 400, 'El país es obligatorio.');

    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('nombre', sql.VarChar(150), name)
      .input('pais', sql.VarChar(50), country)
      .input('contacto', sql.VarChar(150), contact || null)
      .input('telefono', sql.VarChar(20), phone || null)
      .input('correo', sql.VarChar(100), email || null)
      .input('tipo', sql.VarChar(100), contractType || null)
      .input('venc', sql.Date, contractExpiry || null)
      .input('estado', sql.VarChar(20), status)
      .query(`
        UPDATE Editorial
        SET nombre = @nombre,
            pais_origen = @pais,
            nombre_contacto = @contacto,
            telefono = @telefono,
            correo_contacto = @correo,
            tipo_contrato = @tipo,
            vencimiento_contrato = @venc,
            estado = @estado
        WHERE id_editorial = @id
      `);

    const row = await fetchById(pool, req.params.id);
    return res.json(mapEditorial(row));
  } catch (err) {
    console.error('[editoriales] update', err);
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
