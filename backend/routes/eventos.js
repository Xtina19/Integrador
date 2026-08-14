/**
 * API Eventos — adaptada exclusivamente a public/scriptdb
 * Tablas: Evento, Material, PersonalEvento, EditorialEvento,
 *         EventoTieneEditorialEvento, EventoTieneProveedorEvento, DetalleProveedorEvento
 *         (+ Sucursal, Editorial, Persona, Proveedor, Inventario para consultas)
 */
const express = require('express')
const router = express.Router()
const { sql, getConnection } = require('../db')

function fail(res, status, message) {
  return res.status(status).json({ success: false, error: message })
}

async function sucursalDireccion(requestFactory, idSucursal) {
  const r = await requestFactory().input('id', sql.Int, idSucursal).query(`
    SELECT id_direccion FROM Sucursal WHERE id_sucursal = @id
  `)
  return r.recordset[0]?.id_direccion ?? null
}

async function ensureEditorialEvento(requestFactory, idEditorial) {
  const found = await requestFactory()
    .input('idEd', sql.Int, idEditorial)
    .query(`
      SELECT TOP 1 id_editorial_evento
      FROM EditorialEvento
      WHERE id_editorial = @idEd
    `)
  if (found.recordset[0]) return found.recordset[0].id_editorial_evento

  const ins = await requestFactory()
    .input('idEd', sql.Int, idEditorial)
    .query(`
      INSERT INTO EditorialEvento (id_editorial, estado)
      OUTPUT INSERTED.id_editorial_evento
      VALUES (@idEd, 'Activo')
    `)
  return ins.recordset[0].id_editorial_evento
}

async function syncCostoReal(requestFactory, idEvento) {
  const r = await requestFactory().input('id', sql.Int, idEvento).query(`
    SELECT
      COALESCE((
        SELECT SUM(pe.costo) FROM PersonalEvento pe WHERE pe.id_evento = @id
      ), 0)
      + COALESCE((
        SELECT SUM(dpe.cantidad * dpe.costo_unitario)
        FROM EventoTieneProveedorEvento etpe
        INNER JOIN DetalleProveedorEvento dpe ON dpe.id_evento_proveedor = etpe.id_evento_proveedor
        WHERE etpe.id_evento = @id
      ), 0) AS total
  `)
  const total = Number(r.recordset[0]?.total ?? 0)
  await requestFactory()
    .input('id', sql.Int, idEvento)
    .input('total', sql.Decimal(12, 2), total)
    .query(`UPDATE Evento SET costo_real = @total WHERE id_evento = @id`)
  return total
}

async function replaceEditoriales(requestFactory, idEvento, idEditoriales) {
  await requestFactory().input('id', sql.Int, idEvento).query(`
    DELETE FROM EventoTieneEditorialEvento WHERE id_evento = @id
  `)
  for (const raw of idEditoriales ?? []) {
    const idEditorial = Number(raw)
    if (!Number.isInteger(idEditorial) || idEditorial <= 0) continue
    const idEe = await ensureEditorialEvento(requestFactory, idEditorial)
    await requestFactory()
      .input('idEv', sql.Int, idEvento)
      .input('idEe', sql.Int, idEe)
      .query(`
        INSERT INTO EventoTieneEditorialEvento (id_evento, id_editorial_evento, rol_en_evento, confirmado)
        VALUES (@idEv, @idEe, 'Expositor', 1)
      `)
  }
}

async function replacePersonal(requestFactory, idEvento, personal) {
  await requestFactory().input('id', sql.Int, idEvento).query(`
    DELETE FROM PersonalEvento WHERE id_evento = @id
  `)
  for (const p of personal ?? []) {
    const idPersona = Number(p.id_persona)
    if (!Number.isInteger(idPersona) || idPersona <= 0) continue
    await requestFactory()
      .input('idEv', sql.Int, idEvento)
      .input('idPer', sql.Int, idPersona)
      .input('rol', sql.VarChar(100), String(p.rol || 'Logística').slice(0, 100))
      .input('horaEntrada', sql.DateTime, p.hora_entrada || null)
      .input('horaSalida', sql.DateTime, p.hora_salida || null)
      .input('costo', sql.Decimal(10, 2), p.costo != null ? Number(p.costo) : null)
      .input('obs', sql.VarChar(255), p.observacion ? String(p.observacion).slice(0, 255) : null)
      .input('estado', sql.VarChar(20), p.estado || 'Confirmado')
      .query(`
        INSERT INTO PersonalEvento (
          id_evento, id_persona, rol, hora_entrada, hora_salida, costo, observacion, estado
        )
        VALUES (@idEv, @idPer, @rol, @horaEntrada, @horaSalida, @costo, @obs, @estado)
      `)
  }
}

async function replaceUtensilios(requestFactory, idEvento, utensilios) {
  const ids = await requestFactory().input('id', sql.Int, idEvento).query(`
    SELECT id_evento_proveedor FROM EventoTieneProveedorEvento WHERE id_evento = @id
  `)
  for (const row of ids.recordset) {
    await requestFactory()
      .input('idEp', sql.Int, row.id_evento_proveedor)
      .query(`DELETE FROM DetalleProveedorEvento WHERE id_evento_proveedor = @idEp`)
  }
  await requestFactory().input('id', sql.Int, idEvento).query(`
    DELETE FROM EventoTieneProveedorEvento WHERE id_evento = @id
  `)

  const byProv = new Map()
  for (const u of utensilios ?? []) {
    const idProveedor = Number(u.id_proveedor)
    const idMaterial = Number(u.id_material)
    if (!Number.isInteger(idProveedor) || !Number.isInteger(idMaterial)) continue
    if (!byProv.has(idProveedor)) byProv.set(idProveedor, [])
    byProv.get(idProveedor).push(u)
  }

  for (const [idProveedor, items] of byProv) {
    const presupuesto = items.reduce((s, u) => {
      const qty = Number(u.cantidad_usada ?? u.cantidad ?? 0)
      const cost = Number(u.costo_unitario ?? 0)
      return s + qty * cost
    }, 0)
    const ins = await requestFactory()
      .input('idEv', sql.Int, idEvento)
      .input('idProv', sql.Int, idProveedor)
      .input('servicio', sql.VarChar(200), 'Materiales de evento')
      .input('pres', sql.Decimal(12, 2), presupuesto)
      .query(`
        INSERT INTO EventoTieneProveedorEvento (
          id_evento, id_proveedor, servicio_ofrecido, presupuesto_asignado, estado
        )
        OUTPUT INSERTED.id_evento_proveedor
        VALUES (@idEv, @idProv, @servicio, @pres, 'Confirmado')
      `)
    const idEp = ins.recordset[0].id_evento_proveedor
    for (const u of items) {
      const qty = Math.max(1, Number(u.cantidad_usada ?? u.cantidad ?? 0) || 1)
      const cost = Number(u.costo_unitario ?? 0)
      await requestFactory()
        .input('idEp', sql.Int, idEp)
        .input('idMat', sql.Int, Number(u.id_material))
        .input('qty', sql.Int, qty)
        .input('unidad', sql.VarChar(30), u.unidad_medida ? String(u.unidad_medida).slice(0, 30) : null)
        .input('costo', sql.Decimal(10, 2), cost)
        .input('obs', sql.VarChar(255), u.observaciones ? String(u.observaciones).slice(0, 255) : null)
        .query(`
          INSERT INTO DetalleProveedorEvento (
            id_evento_proveedor, id_material, cantidad, unidad_medida, costo_unitario, observacion
          )
          VALUES (@idEp, @idMat, @qty, @unidad, @costo, @obs)
        `)
    }
  }
}

router.get('/editoriales', async (req, res) => {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT id_editorial, nombre FROM Editorial WHERE estado = 'Activo' ORDER BY nombre
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/sucursales', async (req, res) => {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT id_sucursal, nombre, codigo_sucursal
      FROM Sucursal
      WHERE estado = 'Activo'
      ORDER BY nombre
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/productos', async (req, res) => {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT
        p.id_producto,
        p.titulo,
        p.isbn,
        p.precio,
        ISNULL(SUM(i.stock_actual), 0) AS stock
      FROM Producto p
      LEFT JOIN Inventario i ON i.id_producto = p.id_producto
      WHERE p.estado = 'Activo'
      GROUP BY p.id_producto, p.titulo, p.isbn, p.precio
      ORDER BY p.titulo
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/materiales', async (req, res) => {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT id_material, nombre, descripcion, categoria, unidad_medida, costo_estimado, es_consumible
      FROM Material
      WHERE estado = 'Activo'
      ORDER BY nombre
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/personas', async (req, res) => {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT
        id_persona,
        tipo_persona,
        CASE
          WHEN tipo_persona = 'Natural' THEN CONCAT(ISNULL(nombres, ''), ' ', ISNULL(apellidos, ''))
          ELSE ISNULL(razon_social, '')
        END AS nombre
      FROM Persona
      WHERE estado = 'Activo'
      ORDER BY nombre
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/proveedores', async (req, res) => {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT
        pr.id_proveedor,
        pr.codigo_proveedor,
        pr.nombre_comercial,
        CASE
          WHEN p.tipo_persona = 'Natural' THEN CONCAT(ISNULL(p.nombres, ''), ' ', ISNULL(p.apellidos, ''))
          ELSE ISNULL(p.razon_social, '')
        END AS contacto_nombre
      FROM Proveedor pr
      INNER JOIN Persona p ON pr.id_persona = p.id_persona
      WHERE pr.estado = 'Activo'
      ORDER BY pr.nombre_comercial
    `)
    res.json(result.recordset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/resumen', async (req, res) => {
  try {
    const pool = await getConnection()
    const result = await pool.request().query(`
      SELECT
        COUNT(CASE WHEN estado NOT IN ('Finalizado', 'Cancelado') THEN 1 END) AS eventos_activos,
        COALESCE(SUM(presupuesto), 0) AS presupuesto_total,
        COALESCE(SUM(CASE WHEN estado = 'Finalizado' THEN presupuesto - costo_real ELSE 0 END), 0) AS ganancia_eventos
      FROM Evento
    `)
    res.json(result.recordset[0])
  } catch (err) {
    console.error('[eventos] resumen', err)
    res.status(500).json({ error: 'No se pudo obtener el resumen de eventos.', detail: err.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection()
    const eventosResult = await pool.request().query(`
      SELECT
        ev.id_evento,
        ev.nombre,
        ev.tipo_evento,
        s.nombre AS ubicacion,
        ev.id_sucursal,
        ev.fecha_inicio,
        ev.fecha_fin,
        ev.capacidad_esperada,
        COALESCE(ev.presupuesto, 0) AS presupuesto,
        COALESCE(personal.total_personal, 0) + COALESCE(proveedores.total_proveedores, 0) AS costo_actual,
        COALESCE(ev.presupuesto, 0)
          - (COALESCE(personal.total_personal, 0) + COALESCE(proveedores.total_proveedores, 0)) AS disponible,
        ev.estado,
        ev.observacion,
        ev.fecha_registro,
        coord.nombre AS responsable,
        coord.id_persona AS id_persona_responsable
      FROM Evento ev
      INNER JOIN Sucursal s ON s.id_sucursal = ev.id_sucursal
      OUTER APPLY (
        SELECT COALESCE(SUM(pe.costo), 0) AS total_personal
        FROM PersonalEvento pe
        WHERE pe.id_evento = ev.id_evento
      ) personal
      OUTER APPLY (
        SELECT COALESCE(SUM(dpe.cantidad * dpe.costo_unitario), 0) AS total_proveedores
        FROM EventoTieneProveedorEvento etpe
        INNER JOIN DetalleProveedorEvento dpe ON dpe.id_evento_proveedor = etpe.id_evento_proveedor
        WHERE etpe.id_evento = ev.id_evento
      ) proveedores
      OUTER APPLY (
        SELECT TOP 1
          CASE
            WHEN per.tipo_persona = 'Natural' THEN CONCAT(ISNULL(per.nombres, ''), ' ', ISNULL(per.apellidos, ''))
            ELSE ISNULL(per.razon_social, '')
          END AS nombre,
          pe.id_persona
        FROM PersonalEvento pe
        INNER JOIN Persona per ON pe.id_persona = per.id_persona
        WHERE pe.id_evento = ev.id_evento
        ORDER BY CASE WHEN LOWER(pe.rol) LIKE '%coordina%' THEN 0 ELSE 1 END, pe.id_personal_evento
      ) coord
      ORDER BY ev.fecha_inicio DESC
    `)

    const eventos = eventosResult.recordset
    if (eventos.length === 0) return res.json([])

    const editorialesResult = await pool.request().query(`
      SELECT
        etee.id_evento,
        e.id_editorial,
        e.nombre
      FROM EventoTieneEditorialEvento etee
      INNER JOIN EditorialEvento ee ON ee.id_editorial_evento = etee.id_editorial_evento
      INNER JOIN Editorial e ON e.id_editorial = ee.id_editorial
    `)

    const editorialesPorEvento = {}
    for (const row of editorialesResult.recordset) {
      if (!editorialesPorEvento[row.id_evento]) editorialesPorEvento[row.id_evento] = []
      editorialesPorEvento[row.id_evento].push({ id_editorial: row.id_editorial, nombre: row.nombre })
    }

    res.json(
      eventos.map((ev) => ({
        ...ev,
        editoriales: editorialesPorEvento[ev.id_evento] ?? [],
      })),
    )
  } catch (err) {
    console.error('[eventos] list', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de evento inválido')

    const pool = await getConnection()
    const eventoResult = await pool.request().input('id', sql.Int, id).query(`
      SELECT
        ev.id_evento,
        ev.nombre,
        ev.descripcion,
        ev.tipo_evento,
        ev.id_sucursal,
        s.nombre AS ubicacion,
        ev.fecha_inicio,
        ev.fecha_fin,
        ev.capacidad_esperada,
        ev.presupuesto,
        ev.costo_real,
        ev.estado,
        ev.observacion,
        ev.fecha_registro
      FROM Evento ev
      INNER JOIN Sucursal s ON s.id_sucursal = ev.id_sucursal
      WHERE ev.id_evento = @id
    `)

    if (!eventoResult.recordset[0]) return fail(res, 404, 'Evento no encontrado')
    const evento = eventoResult.recordset[0]

    const editorialesResult = await pool.request().input('id', sql.Int, id).query(`
      SELECT e.id_editorial, e.nombre, etee.rol_en_evento, etee.stand
      FROM EventoTieneEditorialEvento etee
      INNER JOIN EditorialEvento ee ON ee.id_editorial_evento = etee.id_editorial_evento
      INNER JOIN Editorial e ON e.id_editorial = ee.id_editorial
      WHERE etee.id_evento = @id
    `)

    const inventarioResult = await pool.request().input('idSuc', sql.Int, evento.id_sucursal).query(`
      SELECT
        p.id_producto,
        p.titulo,
        p.isbn,
        i.stock_actual AS cantidad,
        a.nombre AS sucursal
      FROM Inventario i
      INNER JOIN Producto p ON p.id_producto = i.id_producto
      INNER JOIN Almacen a ON a.id_almacen = i.id_almacen
      WHERE a.id_sucursal = @idSuc AND i.stock_actual > 0
      ORDER BY p.titulo
    `)

    const personalResult = await pool.request().input('id', sql.Int, id).query(`
      SELECT
        pe.id_personal_evento,
        pe.id_persona,
        CASE
          WHEN per.tipo_persona = 'Natural' THEN CONCAT(ISNULL(per.nombres, ''), ' ', ISNULL(per.apellidos, ''))
          ELSE ISNULL(per.razon_social, '')
        END AS nombre_persona,
        pe.rol,
        pe.hora_entrada,
        pe.hora_salida,
        pe.costo,
        pe.observacion,
        pe.estado
      FROM PersonalEvento pe
      INNER JOIN Persona per ON pe.id_persona = per.id_persona
      WHERE pe.id_evento = @id
    `)

    const utensiliosResult = await pool.request().input('id', sql.Int, id).query(`
      SELECT
        dpe.id_detalle_prov_evento,
        dpe.id_material,
        m.nombre AS nombre_material,
        etpe.id_proveedor,
        pr.nombre_comercial,
        dpe.cantidad AS cantidad_usada,
        dpe.costo_unitario,
        dpe.cantidad * dpe.costo_unitario AS costo_total,
        dpe.observacion AS observaciones
      FROM EventoTieneProveedorEvento etpe
      INNER JOIN DetalleProveedorEvento dpe ON dpe.id_evento_proveedor = etpe.id_evento_proveedor
      INNER JOIN Material m ON m.id_material = dpe.id_material
      INNER JOIN Proveedor pr ON pr.id_proveedor = etpe.id_proveedor
      WHERE etpe.id_evento = @id
    `)

    const coordinador =
      personalResult.recordset.find((p) => String(p.rol).toLowerCase().includes('coordina'))
      || personalResult.recordset[0]

    res.json({
      ...evento,
      responsable: coordinador?.nombre_persona ?? null,
      id_persona_responsable: coordinador?.id_persona ?? null,
      editoriales: editorialesResult.recordset,
      inventario: inventarioResult.recordset,
      personal: personalResult.recordset,
      utensilios: utensiliosResult.recordset,
    })
  } catch (err) {
    console.error('[eventos] get', err)
    res.status(500).json({ error: err.message })
  }
})

async function persistEvento(req, res, idEventoExistente) {
  const body = req.body ?? {}
  const nombre = String(body.nombre || '').trim()
  const idSucursal = Number(body.id_sucursal)
  const fechaInicio = body.fecha_inicio
  const fechaFin = body.fecha_fin

  if (!nombre) return fail(res, 400, 'El nombre del evento es obligatorio.')
  if (!Number.isInteger(idSucursal) || idSucursal <= 0) return fail(res, 400, 'Seleccione una sucursal.')
  if (!fechaInicio || !fechaFin) return fail(res, 400, 'Las fechas de inicio y fin son obligatorias.')

  const pool = await getConnection()
  const tx = new sql.Transaction(pool)
  await tx.begin()
  const requestFactory = () => new sql.Request(tx)

  try {
    const idDireccion = await sucursalDireccion(requestFactory, idSucursal)
    let idEvento = idEventoExistente

    if (!idEvento) {
      const ins = await requestFactory()
        .input('nombre', sql.VarChar(200), nombre)
        .input('desc', sql.NVarChar(sql.MAX), body.descripcion ? String(body.descripcion) : null)
        .input('idSuc', sql.Int, idSucursal)
        .input('idDir', sql.Int, idDireccion)
        .input('fi', sql.DateTime, fechaInicio)
        .input('ff', sql.DateTime, fechaFin)
        .input('cap', sql.Int, body.capacidad_esperada != null ? Number(body.capacidad_esperada) : null)
        .input('pres', sql.Decimal(12, 2), Number(body.presupuesto ?? 0))
        .input('tipo', sql.VarChar(100), String(body.tipo_evento || 'Feria del libro').slice(0, 100))
        .input('estado', sql.VarChar(50), body.estado || 'Planificado')
        .input('obs', sql.VarChar(255), body.observacion ? String(body.observacion).slice(0, 255) : null)
        .query(`
          INSERT INTO Evento (
            nombre, descripcion, id_sucursal, id_direccion,
            fecha_inicio, fecha_fin, capacidad_esperada, presupuesto,
            tipo_evento, estado, observacion
          )
          OUTPUT INSERTED.id_evento
          VALUES (
            @nombre, @desc, @idSuc, @idDir,
            @fi, @ff, @cap, @pres,
            @tipo, @estado, @obs
          )
        `)
      idEvento = ins.recordset[0].id_evento
    } else {
      await requestFactory()
        .input('id', sql.Int, idEvento)
        .input('nombre', sql.VarChar(200), nombre)
        .input('desc', sql.NVarChar(sql.MAX), body.descripcion ? String(body.descripcion) : null)
        .input('idSuc', sql.Int, idSucursal)
        .input('idDir', sql.Int, idDireccion)
        .input('fi', sql.DateTime, fechaInicio)
        .input('ff', sql.DateTime, fechaFin)
        .input('cap', sql.Int, body.capacidad_esperada != null ? Number(body.capacidad_esperada) : null)
        .input('pres', sql.Decimal(12, 2), Number(body.presupuesto ?? 0))
        .input('tipo', sql.VarChar(100), String(body.tipo_evento || 'Feria del libro').slice(0, 100))
        .input('estado', sql.VarChar(50), body.estado || 'Planificado')
        .input('obs', sql.VarChar(255), body.observacion ? String(body.observacion).slice(0, 255) : null)
        .query(`
          UPDATE Evento SET
            nombre = @nombre,
            descripcion = @desc,
            id_sucursal = @idSuc,
            id_direccion = @idDir,
            fecha_inicio = @fi,
            fecha_fin = @ff,
            capacidad_esperada = @cap,
            presupuesto = @pres,
            tipo_evento = @tipo,
            estado = @estado,
            observacion = @obs
          WHERE id_evento = @id
        `)
    }

    const personal = Array.isArray(body.personal) ? [...body.personal] : []
    const idResp = Number(body.id_persona_responsable)
    if (Number.isInteger(idResp) && idResp > 0 && !personal.some((p) => Number(p.id_persona) === idResp)) {
      personal.unshift({ id_persona: idResp, rol: 'Coordinador', estado: 'Confirmado' })
    }

    await replaceEditoriales(requestFactory, idEvento, body.id_editoriales)
    await replacePersonal(requestFactory, idEvento, personal)
    await replaceUtensilios(requestFactory, idEvento, body.utensilios)
    await syncCostoReal(requestFactory, idEvento)

    await tx.commit()
    return res.status(idEventoExistente ? 200 : 201).json({ success: true, id_evento: idEvento })
  } catch (err) {
    try { await tx.rollback() } catch { /* noop */ }
    console.error('[eventos] persist', err)
    return fail(res, 500, err.message || 'Error de base de datos')
  }
}

router.post('/', async (req, res) => persistEvento(req, res, null))

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return fail(res, 400, 'Id de evento inválido')
  return persistEvento(req, res, id)
})

router.delete('/:id', async (req, res) => {
  const idEvento = Number(req.params.id)
  if (!Number.isInteger(idEvento) || idEvento <= 0) return fail(res, 400, 'Id de evento inválido')

  const pool = await getConnection()
  const tx = new sql.Transaction(pool)
  try {
    await tx.begin()
    const ids = await new sql.Request(tx).input('id', sql.Int, idEvento).query(`
      SELECT id_evento_proveedor FROM EventoTieneProveedorEvento WHERE id_evento = @id
    `)
    for (const row of ids.recordset) {
      await new sql.Request(tx)
        .input('idEp', sql.Int, row.id_evento_proveedor)
        .query(`DELETE FROM DetalleProveedorEvento WHERE id_evento_proveedor = @idEp`)
    }
    await new sql.Request(tx).input('id', sql.Int, idEvento).query(`
      DELETE FROM EventoTieneProveedorEvento WHERE id_evento = @id;
      DELETE FROM EventoTieneEditorialEvento WHERE id_evento = @id;
      DELETE FROM PersonalEvento WHERE id_evento = @id;
      DELETE FROM Evento WHERE id_evento = @id;
    `)
    await tx.commit()
    res.json({ success: true })
  } catch (err) {
    try { await tx.rollback() } catch { /* noop */ }
    console.error('[eventos] delete', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
