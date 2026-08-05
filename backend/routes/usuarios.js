/**
 * API Usuarios — scriptdb tabla Usuario
 * Contrato FE: id, code, name, lastName, email, phone, roleId, roleName, status
 * Código / login: USR###### en nombre_usuario (auto, inmutable)
 */
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');
const { nextCodigoFromColumn } = require('../lib/codigoAuto');

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

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function mapUsuario(row) {
  const full = String(row.display_name || '').trim();
  const parts = full.split(/\s+/).filter(Boolean);
  return {
    id: String(row.id_usuario),
    code: row.nombre_usuario,
    name: parts[0] || row.nombre_usuario,
    lastName: parts.slice(1).join(' ') || '',
    email: row.correo || '',
    phone: '',
    roleId: row.rol || 'usuario',
    roleName: row.rol || 'usuario',
    status: mapEstadoToFe(row.estado),
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
      SELECT
        u.id_usuario,
        u.nombre_usuario,
        u.correo,
        u.rol,
        u.estado,
        COALESCE(
          NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(pe.nombres, ''), ' ', ISNULL(pe.apellidos, '')))), ''),
          pe.razon_social,
          u.nombre_usuario
        ) AS display_name
      FROM Usuario u
      LEFT JOIN Persona pe ON pe.id_persona = u.id_persona
      WHERE u.id_usuario = @id
    `);
  return result.recordset[0] || null;
}

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 100, 1), 500);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const offset = (page - 1) * pageSize;
    const q = String(req.query.q || req.query.search || '').trim();

    const request = pool.request();
    let where = ' WHERE 1=1 ';
    if (q) {
      request.input('q', sql.NVarChar(200), `%${q}%`);
      where += `
        AND (
          u.nombre_usuario LIKE @q
          OR u.correo LIKE @q
          OR u.rol LIKE @q
        )`;
    }
    if (req.query.status || req.query.estado) {
      request.input('estado', sql.VarChar(20), mapEstadoToDb(req.query.status || req.query.estado));
      where += ' AND u.estado = @estado ';
    }
    request.input('offset', sql.Int, offset);
    request.input('limit', sql.Int, pageSize);

    const countResult = await pool
      .request()
      .input('q', sql.NVarChar(200), q ? `%${q}%` : null)
      .input(
        'estado',
        sql.VarChar(20),
        req.query.status || req.query.estado
          ? mapEstadoToDb(req.query.status || req.query.estado)
          : null,
      )
      .query(`
        SELECT COUNT(*) AS total
        FROM Usuario u
        WHERE 1=1
          AND (@q IS NULL OR (
            u.nombre_usuario LIKE @q OR u.correo LIKE @q OR u.rol LIKE @q
          ))
          AND (@estado IS NULL OR u.estado = @estado)
      `);

    const total = countResult.recordset[0].total;
    const result = await request.query(`
      SELECT
        u.id_usuario,
        u.nombre_usuario,
        u.correo,
        u.rol,
        u.estado,
        COALESCE(
          NULLIF(LTRIM(RTRIM(CONCAT(ISNULL(pe.nombres, ''), ' ', ISNULL(pe.apellidos, '')))), ''),
          pe.razon_social,
          u.nombre_usuario
        ) AS display_name
      FROM Usuario u
      LEFT JOIN Persona pe ON pe.id_persona = u.id_persona
      ${where}
      ORDER BY u.nombre_usuario
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return res.json({
      success: true,
      data: result.recordset.map(mapUsuario),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error('[usuarios] list', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const row = await fetchById(pool, req.params.id);
    if (!row) return fail(res, 404, 'Usuario no encontrado');
    return res.json(mapUsuario(row));
  } catch (err) {
    console.error('[usuarios] get', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const body = req.body || {};
    const name = String(body.name || body.nombre || '').trim();
    const lastName = String(body.lastName || body.apellido || body.apellidos || '').trim();
    const email = String(body.email || body.correo || '').trim();
    const password = String(body.password || body.contrasena || '').trim();
    const role =
      String(body.roleName || body.rol || body.roleId || body.role || 'usuario').trim() ||
      'usuario';
    const estado = mapEstadoToDb(body.status || body.estado || 'active');

    if (!name) return fail(res, 400, 'El nombre es obligatorio.');
    if (!email) return fail(res, 400, 'El correo es obligatorio.');
    if (!password || password.length < 6) {
      return fail(res, 400, 'La contraseña debe tener al menos 6 caracteres.');
    }

    const codigo = await nextCodigoFromColumn(pool, {
      table: 'Usuario',
      column: 'nombre_usuario',
      prefix: 'USR',
    });

    const persona = await pool
      .request()
      .input('tipo', sql.VarChar(20), 'Natural')
      .input('nombres', sql.VarChar(100), name)
      .input('apellidos', sql.VarChar(100), lastName || null)
      .input('docTipo', sql.VarChar(30), 'Cedula')
      .input('docNum', sql.VarChar(50), `U${Date.now()}`)
      .input('correo', sql.VarChar(150), email)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO Persona (
          tipo_persona, nombres, apellidos, documento_tipo, documento_numero, correo, estado
        )
        OUTPUT INSERTED.id_persona
        VALUES (@tipo, @nombres, @apellidos, @docTipo, @docNum, @correo, @estado)
      `);

    const inserted = await pool
      .request()
      .input('idPersona', sql.Int, persona.recordset[0].id_persona)
      .input('usuario', sql.VarChar(80), codigo)
      .input('correo', sql.VarChar(150), email)
      .input('hash', sql.VarChar(255), hashPassword(password))
      .input('rol', sql.VarChar(50), role)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO Usuario (
          id_persona, nombre_usuario, correo, contrasena_hash, rol, estado
        )
        OUTPUT INSERTED.id_usuario
        VALUES (@idPersona, @usuario, @correo, @hash, @rol, @estado)
      `);

    const row = await fetchById(pool, inserted.recordset[0].id_usuario);
    return res.status(201).json(mapUsuario(row));
  } catch (err) {
    console.error('[usuarios] create', err);
    if (err.number === 2627 || err.number === 2601) {
      return fail(res, 409, 'Ya existe un usuario con ese correo.');
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Usuario no encontrado');

    const body = req.body || {};
    const email =
      body.email != null || body.correo != null
        ? String(body.email || body.correo || '').trim()
        : existing.correo;
    const role =
      body.roleName != null || body.rol != null || body.roleId != null
        ? String(body.roleName || body.rol || body.roleId || '').trim()
        : existing.rol;
    const estado =
      body.status != null || body.estado != null
        ? mapEstadoToDb(body.status || body.estado)
        : existing.estado;
    const password = body.password != null ? String(body.password).trim() : '';

    if (!email) return fail(res, 400, 'El correo es obligatorio.');

    const request = pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('correo', sql.VarChar(150), email)
      .input('rol', sql.VarChar(50), role)
      .input('estado', sql.VarChar(20), estado);

    if (password) {
      request.input('hash', sql.VarChar(255), hashPassword(password));
      await request.query(`
        UPDATE Usuario
        SET correo = @correo,
            rol = @rol,
            estado = @estado,
            contrasena_hash = @hash,
            fecha_actualizacion = GETDATE()
        WHERE id_usuario = @id
      `);
    } else {
      await request.query(`
        UPDATE Usuario
        SET correo = @correo,
            rol = @rol,
            estado = @estado,
            fecha_actualizacion = GETDATE()
        WHERE id_usuario = @id
      `);
    }

    const row = await fetchById(pool, req.params.id);
    return res.json(mapUsuario(row));
  } catch (err) {
    console.error('[usuarios] update', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.patch('/:id/estado', async (req, res) => {
  try {
    const pool = await getConnection();
    const existing = await fetchById(pool, req.params.id);
    if (!existing) return fail(res, 404, 'Usuario no encontrado');
    const estado = mapEstadoToDb(req.body?.status || req.body?.estado);
    await pool
      .request()
      .input('id', sql.Int, Number(req.params.id))
      .input('estado', sql.VarChar(20), estado)
      .query(`
        UPDATE Usuario
        SET estado = @estado, fecha_actualizacion = GETDATE()
        WHERE id_usuario = @id
      `);
    const row = await fetchById(pool, req.params.id);
    return res.json(mapUsuario(row));
  } catch (err) {
    console.error('[usuarios] estado', err);
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

module.exports = router;
