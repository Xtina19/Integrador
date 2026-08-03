const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');

/* ============================================================
   LISTAS PARA LOS SELECT DEL FORMULARIO DE EVENTOS
   ============================================================ */

// Editoriales
router.get('/editoriales', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT id_editorial, nombre FROM Editorial ORDER BY nombre');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Productos (para el tab de Inventario)
router.get('/productos', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_producto, titulo, isbn, precio, stock
      FROM Producto
      WHERE estado = 'Activo'
      ORDER BY titulo
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Materiales (para el tab de Utensilios)
router.get('/materiales', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT id_material, nombre, descripcion, categoria, unidad_medida, costo_estimado, es_consumible
      FROM Material
      WHERE estado = 'Activo'
      ORDER BY nombre
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Personas (para el tab de Personal)
router.get('/personas', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        id_persona,
        tipo_persona,
        CASE
          WHEN tipo_persona = 'Natural' THEN CONCAT(nombres, ' ', apellidos)
          ELSE razon_social
        END AS nombre
      FROM Persona
      WHERE estado = 'Activo'
      ORDER BY nombre
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Proveedores (para el tab de Utensilios)
router.get('/proveedores', async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT
        pr.id_proveedor,
        pr.codigo_proveedor,
        pr.nombre_comercial,
        CASE
          WHEN p.tipo_persona = 'Natural' THEN CONCAT(p.nombres, ' ', p.apellidos)
          ELSE p.razon_social
        END AS contacto_nombre
      FROM Proveedor pr
      JOIN Persona p ON pr.id_persona = p.id_persona
      WHERE pr.estado = 'Activo'
      ORDER BY pr.nombre_comercial
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   GET - Listado de eventos (con editoriales agregadas)
   ============================================================ */

router.get('/', async (req, res) => {
  try {
    const pool = await getConnection();
    const eventosResult = await pool.request().query(`
  SELECT
    ev.id_evento,
    ev.nombre,
    ev.tipo_evento,
    COALESCE(ev.Ubicacion, 'Ubicación no especificada') AS ubicacion,
    ev.fecha_inicio,
    ev.fecha_fin,
    ev.capacidad_esperada,
    COALESCE(ev.presupuesto, 0) AS presupuesto,

    COALESCE(personal.total_personal, 0)
      + COALESCE(proveedores.total_proveedores, 0) AS costo_actual,

    COALESCE(ev.presupuesto, 0)
      - (
          COALESCE(personal.total_personal, 0)
          + COALESCE(proveedores.total_proveedores, 0)
        ) AS disponible,

    ev.estado,
    ev.observacion,
    ev.fecha_registro

  FROM Evento ev

  OUTER APPLY (
    SELECT COALESCE(SUM(pe.costo), 0) AS total_personal
    FROM PersonalEvento pe
    WHERE pe.id_evento = ev.id_evento
  ) personal

  OUTER APPLY (
    SELECT COALESCE(SUM(dpe.cantidad * dpe.costo_unitario), 0)
      AS total_proveedores
    FROM EventoTieneProveedorEvento etpe
    INNER JOIN DetalleProveedorEvento dpe
      ON dpe.id_evento_proveedor = etpe.id_evento_proveedor
    WHERE etpe.id_evento = ev.id_evento
  ) proveedores

  ORDER BY ev.fecha_inicio DESC
`);

    const eventos = eventosResult.recordset;
    if (eventos.length === 0) return res.json([]);

    const editorialesResult = await pool.request().query(`
      SELECT ee.id_evento, e.id_editorial, e.nombre
      FROM EditorialEvento ee
      JOIN Editorial e ON ee.id_editorial = e.id_editorial
    `);

    const editorialesPorEvento = {};
    for (const row of editorialesResult.recordset) {
      if (!editorialesPorEvento[row.id_evento]) editorialesPorEvento[row.id_evento] = [];
      editorialesPorEvento[row.id_evento].push({ id_editorial: row.id_editorial, nombre: row.nombre });
    }

    const eventosConEditoriales = eventos.map((ev) => ({
      ...ev,
      editoriales: editorialesPorEvento[ev.id_evento] ?? [],
    }));

    res.json(eventosConEditoriales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//  ============================================================
//      GET - Resumen de ganancias y actividades
//  ============================================================

router.get('/resumen', async (req, res) => {
  try {
    const pool = await getConnection()

    const result = await pool.request().query(`
      SELECT
        COUNT(
          CASE
            WHEN LOWER(LTRIM(RTRIM(estado)))
              NOT IN ('finalizado', 'finalized')
            THEN 1
          END
        ) AS eventos_activos,

        COALESCE(SUM(presupuesto), 0) AS presupuesto_total,

        CAST(0 AS DECIMAL(12,2)) AS ganancia_eventos

      FROM Evento
    `)

    res.json(result.recordset[0])
  } catch (error) {
    console.error('Error obteniendo resumen de eventos:', error)

    res.status(500).json({
      error: 'No se pudo obtener el resumen de eventos.',
      detail: error.message,
    })
  }
})

//  ============================================================
//      GET - Un evento por id, con todas sus tablas hijas
//  ============================================================

router.get('/:id', async (req, res) => {
  try {
    const pool = await getConnection();
    const id = req.params.id;

    const eventoResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id_evento,
  nombre,
  tipo_evento,
  Ubicacion,
  fecha_inicio,
  fecha_fin,
  capacidad_esperada,
  presupuesto,
  pre_gastado,
  pre_disponible,
  responsable,
  estado,
  observacion,
  fecha_registro
        FROM Evento
        WHERE id_evento = @id
      `);

    if (eventoResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const editorialesResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT e.id_editorial, e.nombre
        FROM EditorialEvento ee
        JOIN Editorial e ON ee.id_editorial = e.id_editorial
        WHERE ee.id_evento = @id
      `);

    const inventarioResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT ie.id_producto, p.titulo, ie.ISBN, ie.Cantidad, ie.Sucursal
        FROM InventarioEvento ie
        JOIN Producto p ON ie.id_producto = p.id_producto
        WHERE ie.id_evento = @id
      `);

    const personalResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          pe.id_personal_evento, pe.id_persona,
          CASE
            WHEN per.tipo_persona = 'Natural' THEN CONCAT(per.nombres, ' ', per.apellidos)
            ELSE per.razon_social
          END AS nombre_persona,
          pe.rol, pe.hora_entrada, pe.hora_salida, pe.costo, pe.observacion, pe.estado
        FROM PersonalEvento pe
        JOIN Persona per ON pe.id_persona = per.id_persona
        WHERE pe.id_evento = @id
      `);

    const utensiliosResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          ue.id_material, m.nombre AS nombre_material,
          ue.id_proveedor, pr.nombre_comercial,
          ue.CantidadUsada, ue.CostoUnitario, ue.CostoTotal, ue.Observaciones
        FROM UtensiliosEvento ue
        JOIN Material m ON ue.id_material = m.id_material
        JOIN Proveedor pr ON ue.id_proveedor = pr.id_proveedor
        WHERE ue.id_evento = @id
      `);

    res.json({
      ...eventoResult.recordset[0],
      editoriales: editorialesResult.recordset,
      inventario: inventarioResult.recordset,
      personal: personalResult.recordset,
      utensilios: utensiliosResult.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   POST - Crear evento (con todas sus tablas hijas)
   ============================================================ */

router.post('/', async (req, res) => {
  const {
    nombre, tipo_evento, ubicacion, fecha_inicio, fecha_fin,
    capacidad_esperada, presupuesto, responsable, observacion, estado,
    id_editoriales,
    inventario,
    personal,
    utensilios,
  } = req.body;

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const eventoResult = await new sql.Request(transaction)
      .input('nombre', sql.VarChar(200), nombre)
      .input('tipoEvento', sql.VarChar(100), tipo_evento)
      .input('ubicacion', sql.VarChar(200), ubicacion)
      .input('fechaInicio', sql.DateTime, fecha_inicio)
      .input('fechaFin', sql.DateTime, fecha_fin)
      .input('capacidad', sql.Int, capacidad_esperada ?? null)
      .input('presupuesto', sql.Decimal(12, 2), presupuesto ?? null)
      .input('responsable', sql.VarChar(150), responsable ?? null)
      .input('estado', sql.VarChar(50), estado ?? 'Planificado')
      .input('observacion', sql.VarChar(255), observacion ?? null)
      .query(`
        INSERT INTO Evento
          (nombre, tipo_evento, Ubicacion, fecha_inicio, fecha_fin, capacidad_esperada, presupuesto, responsable, estado, observacion)
        OUTPUT INSERTED.id_evento
        VALUES
          (@nombre, @tipoEvento, @ubicacion, @fechaInicio, @fechaFin, @capacidad, @presupuesto, @responsable, @estado, @observacion)
      `);

    const idEvento = eventoResult.recordset[0].id_evento;

    for (const idEditorial of id_editoriales ?? []) {
      await new sql.Request(transaction)
        .input('idEditorial', sql.Int, idEditorial)
        .input('idEvento', sql.Int, idEvento)
        .query(`INSERT INTO EditorialEvento (id_editorial, id_evento) VALUES (@idEditorial, @idEvento)`);
    }

    for (const item of inventario ?? []) {
      await new sql.Request(transaction)
        .input('idEvento', sql.Int, idEvento)
        .input('idProducto', sql.Int, item.id_producto)
        .input('isbn', sql.VarChar(30), item.isbn)
        .input('cantidad', sql.Int, item.cantidad)
        .input('sucursal', sql.VarChar(255), item.sucursal ?? null)
        .query(`
          INSERT INTO InventarioEvento (id_evento, id_producto, ISBN, Cantidad, Sucursal)
          VALUES (@idEvento, @idProducto, @isbn, @cantidad, @sucursal)
        `);
    }

    for (const p of personal ?? []) {
      await new sql.Request(transaction)
        .input('idEvento', sql.Int, idEvento)
        .input('idPersona', sql.Int, p.id_persona)
        .input('rol', sql.VarChar(100), p.rol)
        .input('horaEntrada', sql.DateTime, p.hora_entrada ?? null)
        .input('horaSalida', sql.DateTime, p.hora_salida ?? null)
        .input('costo', sql.Decimal(10, 2), p.costo ?? null)
        .input('observacion', sql.VarChar(255), p.observacion ?? null)
        .input('estado', sql.VarChar(20), p.estado ?? 'Confirmado')
        .query(`
          INSERT INTO PersonalEvento (id_evento, id_persona, rol, hora_entrada, hora_salida, costo, observacion, estado)
          VALUES (@idEvento, @idPersona, @rol, @horaEntrada, @horaSalida, @costo, @observacion, @estado)
        `);
    }

    for (const u of utensilios ?? []) {
      const cantidadUsada = Number(u.cantidad_usada) || 0;
      const costoUnitario = Number(u.costo_unitario) || 0;
      const costoTotal = cantidadUsada * costoUnitario;

      await new sql.Request(transaction)
        .input('idEvento', sql.Int, idEvento)
        .input('idMaterial', sql.Int, u.id_material)
        .input('idProveedor', sql.Int, u.id_proveedor)
        .input('cantidadUsada', sql.Int, cantidadUsada)
        .input('costoUnitario', sql.Decimal(12, 2), costoUnitario)
        .input('costoTotal', sql.Decimal(12, 2), costoTotal)
        .input(
          'observaciones',
          sql.VarChar(255),
          u.observaciones ?? null
        )
        .query(`
      INSERT INTO UtensiliosEvento (
        id_evento,
        id_material,
        id_proveedor,
        CantidadUsada,
        CostoUnitario,
        CostoTotal,
        Observaciones
      )
      VALUES (
        @idEvento,
        @idMaterial,
        @idProveedor,
        @cantidadUsada,
        @costoUnitario,
        @costoTotal,
        @observaciones
      )
    `);
    }

    const totalUtensiliosResult = await new sql.Request(transaction)
      .input('idEvento', sql.Int, idEvento)
      .query(`
    SELECT COALESCE(SUM(CostoTotal), 0) AS total_gastado
    FROM UtensiliosEvento
    WHERE id_evento = @idEvento
  `);

    const totalGastado =
      Number(totalUtensiliosResult.recordset[0].total_gastado) || 0;

    await new sql.Request(transaction)
      .input('idEvento', sql.Int, idEvento)
      .input('totalGastado', sql.Decimal(12, 2), totalGastado)
      .query(`
    UPDATE Evento
    SET
      pre_gastado = @totalGastado,
      pre_disponible = presupuesto - @totalGastado
    WHERE id_evento = @idEvento
  `);

    await transaction.commit();
    res.status(201).json({ success: true, id_evento: idEvento });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ============================================================
   PUT - Actualizar evento
   Estrategia: actualizar Evento, y para las tablas hijas
   borrar-y-reinsertar.
   ============================================================ */

router.put('/:id', async (req, res) => {
  const idEvento = req.params.id;
  const {
    nombre, tipo_evento, ubicacion, fecha_inicio, fecha_fin,
    capacidad_esperada, presupuesto, responsable, observacion, estado,
    id_editoriales,
    inventario,
    personal,
    utensilios,
  } = req.body;

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction)
      .input('id', sql.Int, idEvento)
      .input('nombre', sql.VarChar(200), nombre)
      .input('tipoEvento', sql.VarChar(100), tipo_evento)
      .input('ubicacion', sql.VarChar(200), ubicacion)
      .input('fechaInicio', sql.DateTime, fecha_inicio)
      .input('fechaFin', sql.DateTime, fecha_fin)
      .input('capacidad', sql.Int, capacidad_esperada ?? null)
      .input('presupuesto', sql.Decimal(12, 2), presupuesto ?? null)
      .input('responsable', sql.VarChar(150), responsable ?? null)
      .input('estado', sql.VarChar(50), estado ?? 'Planificado')
      .input('observacion', sql.VarChar(255), observacion ?? null)
      .query(`
        UPDATE Evento SET
          nombre = @nombre, tipo_evento = @tipoEvento, Ubicacion = @ubicacion,
          fecha_inicio = @fechaInicio, fecha_fin = @fechaFin, capacidad_esperada = @capacidad,
          presupuesto = @presupuesto, responsable = @responsable, estado = @estado, observacion = @observacion
        WHERE id_evento = @id
      `);

    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM EditorialEvento WHERE id_evento = @id');
    for (const idEditorial of id_editoriales ?? []) {
      await new sql.Request(transaction)
        .input('idEditorial', sql.Int, idEditorial)
        .input('idEvento', sql.Int, idEvento)
        .query(`INSERT INTO EditorialEvento (id_editorial, id_evento) VALUES (@idEditorial, @idEvento)`);
    }

    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM InventarioEvento WHERE id_evento = @id');
    for (const item of inventario ?? []) {
      await new sql.Request(transaction)
        .input('idEvento', sql.Int, idEvento)
        .input('idProducto', sql.Int, item.id_producto)
        .input('isbn', sql.VarChar(50), item.isbn)
        .input('cantidad', sql.Int, item.cantidad)
        .input('sucursal', sql.VarChar(255), item.sucursal ?? null)
        .query(`
          INSERT INTO InventarioEvento (id_evento, id_producto, ISBN, Cantidad, Sucursal)
          VALUES (@idEvento, @idProducto, @isbn, @cantidad, @sucursal)
        `);
    }

    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM PersonalEvento WHERE id_evento = @id');
    for (const p of personal ?? []) {
      await new sql.Request(transaction)
        .input('idEvento', sql.Int, idEvento)
        .input('idPersona', sql.Int, p.id_persona)
        .input('rol', sql.VarChar(100), p.rol)
        .input('horaEntrada', sql.DateTime, p.hora_entrada ?? null)
        .input('horaSalida', sql.DateTime, p.hora_salida ?? null)
        .input('costo', sql.Decimal(10, 2), p.costo ?? null)
        .input('observacion', sql.VarChar(255), p.observacion ?? null)
        .input('estado', sql.VarChar(20), p.estado ?? 'Confirmado')
        .query(`
          INSERT INTO PersonalEvento (id_evento, id_persona, rol, hora_entrada, hora_salida, costo, observacion, estado)
          VALUES (@idEvento, @idPersona, @rol, @horaEntrada, @horaSalida, @costo, @observacion, @estado)
        `);
    }

    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM UtensiliosEvento WHERE id_evento = @id');
    for (const u of utensilios ?? []) {
      await new sql.Request(transaction)
        .input('idEvento', sql.Int, idEvento)
        .input('idMaterial', sql.Int, u.id_material)
        .input('idProveedor', sql.Int, u.id_proveedor)
        .input('cantidadUsada', sql.Int, u.cantidad_usada ?? 0)
        .input('costoUnitario', sql.Decimal(12, 2), u.costo_unitario ?? 0)
        .input('costoTotal', sql.Decimal(12, 2), u.costo_total ?? (u.cantidad_usada ?? 0) * (u.costo_unitario ?? 0))
        .input('observaciones', sql.VarChar(255), u.observaciones ?? null)
        .query(`
          INSERT INTO UtensiliosEvento (id_evento, id_material, id_proveedor, CantidadUsada, CostoUnitario, CostoTotal, Observaciones)
          VALUES (@idEvento, @idMaterial, @idProveedor, @cantidadUsada, @costoUnitario, @costoTotal, @observaciones)
        `);
    }

    const totalGastadoResult = await new sql.Request(transaction)
      .input('idEvento', sql.Int, idEvento)
      .query(`
    SELECT COALESCE(SUM(CostoTotal), 0) AS totalGastado
    FROM UtensiliosEvento
    WHERE id_evento = @idEvento
  `);

    const totalGastado =
      Number(totalGastadoResult.recordset[0].totalGastado) || 0;

    await new sql.Request(transaction)
      .input('idEvento', sql.Int, idEvento)
      .input('totalGastado', sql.Decimal(12, 2), totalGastado)
      .query(`
    UPDATE Evento
    SET
      pre_gastado = @totalGastado,
      pre_disponible = presupuesto - @totalGastado
    WHERE id_evento = @idEvento
  `);

    const presupuestoActual = Number(presupuesto) || 0;
    const disponible = presupuestoActual - totalGastado;

    res.json({
      success: true,
      pre_gastado: totalGastado,
      pre_disponible: disponible,
    });

    await transaction.commit();
    res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando evento:', err);

    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('Error al revertir transacción:', rollbackError);
    }

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* ============================================================
   DELETE - Eliminar evento y todas sus tablas hijas
   ============================================================ */

router.delete('/:id', async (req, res) => {
  const idEvento = req.params.id;
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM InventarioEvento WHERE id_evento = @id');
    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM EditorialEvento WHERE id_evento = @id');
    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM PersonalEvento WHERE id_evento = @id');
    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM UtensiliosEvento WHERE id_evento = @id');
    await new sql.Request(transaction).input('id', sql.Int, idEvento).query('DELETE FROM Evento WHERE id_evento = @id');

    await transaction.commit();
    res.json({ success: true });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;