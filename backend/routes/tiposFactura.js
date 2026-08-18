/**
 * API TipoFactura — adaptada exclusivamente a public/scriptdb
 * Tabla: TipoFactura
 */
const express = require('express')
const router = express.Router()
const { getConnection } = require('../db')

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection()
    if (!pool) return res.status(503).json({ error: 'Sin conexión a la base de datos.' })

    const result = await pool.request().query(`
      SELECT
        id_tipo_factura,
        codigo,
        nombre,
        requiere_evento,
        estado,
        fecha_registro
      FROM TipoFactura
      WHERE estado = 'Activo'
      ORDER BY
        CASE codigo WHEN 'normal' THEN 0 WHEN 'factura_evento' THEN 1 ELSE 2 END,
        nombre
    `)

    res.json(
      result.recordset.map((row) => ({
        id: String(row.id_tipo_factura),
        codigo: String(row.codigo),
        nombre: String(row.nombre),
        requiereEvento: Boolean(row.requiere_evento),
        estado: String(row.estado),
      })),
    )
  } catch (err) {
    console.error('[tipos-factura]', err)
    res.status(500).json({ error: 'No se pudieron cargar los tipos de factura.', detail: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const pool = await getConnection()
    if (!pool) return res.status(503).json({ error: 'Sin conexión a la base de datos.' })

    const codigo = String(req.body?.codigo || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
    const nombre = String(req.body?.nombre || '').trim()
    const requiereEvento = Boolean(req.body?.requiereEvento)

    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'codigo y nombre son obligatorios.' })
    }

    const ins = await pool
      .request()
      .input('codigo', codigo)
      .input('nombre', nombre)
      .input('req', requiereEvento ? 1 : 0)
      .query(`
        INSERT INTO TipoFactura (codigo, nombre, requiere_evento, estado)
        OUTPUT INSERTED.id_tipo_factura, INSERTED.codigo, INSERTED.nombre,
               INSERTED.requiere_evento, INSERTED.estado
        VALUES (@codigo, @nombre, @req, 'Activo')
      `)

    const row = ins.recordset[0]
    res.status(201).json({
      id: String(row.id_tipo_factura),
      codigo: String(row.codigo),
      nombre: String(row.nombre),
      requiereEvento: Boolean(row.requiere_evento),
      estado: String(row.estado),
    })
  } catch (err) {
    console.error('[tipos-factura] create', err)
    res.status(500).json({ error: 'No se pudo crear el tipo de factura.', detail: err.message })
  }
})

module.exports = router
