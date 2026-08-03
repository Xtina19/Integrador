const express = require('express');
const router = express.Router();
const { sql, getConnection } = require('../db');

const ESTADOS_PERMITIDOS = ['Activo', 'Inactivo'];

function parseId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    return id;
}

function normalizeText(value) {
    if (typeof value !== 'string') return null;

    const result = value.trim();
    return result || null;
}

function normalizeOptionalId(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    return parseId(value);
}

function mapAlmacen(row) {
    return {
        id: String(row.id_almacen),
        idAlmacen: row.id_almacen,
        sucursalId:
            row.id_sucursal !== null
                ? String(row.id_sucursal)
                : null,
        sucursalNombre: row.sucursal_nombre ?? null,
        sucursalCodigo: row.codigo_sucursal ?? null,
        nombre: row.nombre,
        codigo: row.codigo_almacen,
        direccion: row.direccion ?? '',
        ciudad: row.ciudad ?? '',
        responsable: row.responsable ?? '',
        telefono: row.telefono ?? '',
        tipoAlmacen: row.tipo_almacen ?? '',
        bloqueado: Boolean(row.bloqueado),
        motivoBloqueo: row.motivo_bloqueo ?? '',
        fechaBloqueo: row.fecha_bloqueo ?? null,
        estado: row.estado,
        fechaRegistro: row.fecha_registro,
    };
}

function validateAlmacen(body) {
    const errors = [];

    const nombre = normalizeText(body.nombre);
    const codigo = normalizeText(
        body.codigo ??
        body.codigoAlmacen ??
        body.codigo_almacen
    );

    const sucursalValue =
        body.sucursalId ??
        body.idSucursal ??
        body.id_sucursal;

    const idSucursal = normalizeOptionalId(sucursalValue);

    if (!nombre) {
        errors.push('El nombre del almacén es obligatorio.');
    }

    if (!codigo) {
        errors.push('El código del almacén es obligatorio.');
    }

    if (
        sucursalValue !== undefined &&
        sucursalValue !== null &&
        sucursalValue !== '' &&
        idSucursal === null
    ) {
        errors.push('La sucursal seleccionada no es válida.');
    }

    return {
        valid: errors.length === 0,
        errors,
        data: {
            nombre,
            codigo,
            idSucursal,
            direccion: normalizeText(body.direccion),
            ciudad: normalizeText(body.ciudad),
            responsable: normalizeText(body.responsable),
            telefono: normalizeText(body.telefono),
            tipoAlmacen: normalizeText(
                body.tipoAlmacen ??
                body.tipo_almacen
            ),
        },
    };
}

async function existeSucursal(pool, idSucursal) {
    if (idSucursal === null) {
        return true;
    }

    const result = await pool
        .request()
        .input('idSucursal', sql.Int, idSucursal)
        .query(`
      SELECT id_sucursal
      FROM Sucursal
      WHERE id_sucursal = @idSucursal
    `);

    return result.recordset.length > 0;
}

// ============================================================
// GET /api/almacenes
// Eto solo hace obtener almacenes con las filtraciones corr.
// ============================================================
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();

        const estado = normalizeText(req.query.estado);
        const search = normalizeText(req.query.search);
        const idSucursal = normalizeOptionalId(
            req.query.sucursalId ?? req.query.idSucursal
        );

        const request = pool.request();

        request.input('estado', sql.VarChar(20), estado);
        request.input('search', sql.VarChar(150), search);
        request.input('idSucursal', sql.Int, idSucursal);

        const result = await request.query(`
      SELECT
        a.id_almacen,
        a.id_sucursal,
        s.nombre AS sucursal_nombre,
        s.codigo_sucursal,
        a.nombre,
        a.codigo_almacen,
        a.direccion,
        a.ciudad,
        a.responsable,
        a.telefono,
        a.tipo_almacen,
        a.bloqueado,
        a.motivo_bloqueo,
        a.fecha_bloqueo,
        a.estado,
        a.fecha_registro
      FROM Almacen a
      LEFT JOIN Sucursal s
        ON s.id_sucursal = a.id_sucursal
      WHERE
        (@estado IS NULL OR a.estado = @estado)
        AND (
          @idSucursal IS NULL
          OR a.id_sucursal = @idSucursal
        )
        AND (
          @search IS NULL
          OR a.nombre LIKE '%' + @search + '%'
          OR a.codigo_almacen LIKE '%' + @search + '%'
          OR a.ciudad LIKE '%' + @search + '%'
        )
      ORDER BY
        CASE WHEN a.estado = 'Activo' THEN 0 ELSE 1 END,
        a.nombre ASC
    `);

        return res.json({
            success: true,
            data: result.recordset.map(mapAlmacen),
            total: result.recordset.length,
        });
    } catch (err) {
        console.error('Error obteniendo almacenes:', err);

        return res.status(500).json({
            success: false,
            error: {
                code: 'ALMACEN_LIST_ERROR',
                message: 'No se pudieron obtener los almacenes.',
                details:
                    process.env.NODE_ENV === 'development'
                        ? err.message
                        : undefined,
            },
        });
    }
});

// GET /api/almacenes/opciones/sucursales
router.get('/opciones/sucursales', async (req, res) => {
    try {
        const pool = await getConnection();

        const result = await pool.request().query(`
      SELECT
        id_sucursal,
        nombre,
        codigo_sucursal
      FROM Sucursal
      WHERE estado = 'Activo'
      ORDER BY nombre ASC
    `);

        return res.json({
            success: true,
            data: result.recordset.map((row) => ({
                id: String(row.id_sucursal),
                idSucursal: row.id_sucursal,
                nombre: row.nombre,
                codigo: row.codigo_sucursal,
            })),
            total: result.recordset.length,
        });
    } catch (err) {
        console.error('Error obteniendo sucursales:', err);

        return res.status(500).json({
            success: false,
            error: {
                code: 'SUCURSAL_OPTIONS_ERROR',
                message: 'No se pudieron cargar las sucursales.',
                details: err.message,
            },
        });
    }
});

// ============================================================
// consulta con id a para los almacenes
// ============================================================
router.get('/:id', async (req, res) => {
    const idAlmacen = parseId(req.params.id);

    if (!idAlmacen) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ALMACEN_ID',
                message: 'El identificador del almacén no es válido.',
            },
        });
    }

    try {
        const pool = await getConnection();

        const result = await pool
            .request()
            .input('idAlmacen', sql.Int, idAlmacen)
            .query(`
        SELECT
          a.id_almacen,
          a.id_sucursal,
          s.nombre AS sucursal_nombre,
          s.codigo_sucursal,
          a.nombre,
          a.codigo_almacen,
          a.direccion,
          a.ciudad,
          a.responsable,
          a.telefono,
          a.tipo_almacen,
          a.bloqueado,
          a.motivo_bloqueo,
          a.fecha_bloqueo,
          a.estado,
          a.fecha_registro
        FROM Almacen a
        LEFT JOIN Sucursal s
          ON s.id_sucursal = a.id_sucursal
        WHERE a.id_almacen = @idAlmacen
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ALMACEN_NOT_FOUND',
                    message: 'Almacén no encontrado.',
                },
            });
        }

        return res.json({
            success: true,
            data: mapAlmacen(result.recordset[0]),
        });
    } catch (err) {
        console.error('Error obteniendo almacén:', err);

        return res.status(500).json({
            success: false,
            error: {
                code: 'ALMACEN_GET_ERROR',
                message: 'No se pudo obtener el almacén.',
                details:
                    process.env.NODE_ENV === 'development'
                        ? err.message
                        : undefined,
            },
        });
    }
});

// ============================================================
// hacer insert de un almacen nuevo
// ============================================================
router.post('/', async (req, res) => {
    const validation = validateAlmacen(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'ALMACEN_VALIDATION_ERROR',
                message: validation.errors[0],
                details: validation.errors,
            },
        });
    }

    const data = validation.data;

    try {
        const pool = await getConnection();

        if (!(await existeSucursal(pool, data.idSucursal))) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'SUCURSAL_NOT_FOUND',
                    message: 'La sucursal seleccionada no existe.',
                },
            });
        }

        const duplicate = await pool
            .request()
            .input('codigo', sql.VarChar(30), data.codigo)
            .input('nombre', sql.VarChar(100), data.nombre)
            .input('idSucursal', sql.Int, data.idSucursal)
            .query(`
        SELECT id_almacen
        FROM Almacen
        WHERE
          codigo_almacen = @codigo
          OR (
            nombre = @nombre
            AND (
              id_sucursal = @idSucursal
              OR (
                id_sucursal IS NULL
                AND @idSucursal IS NULL
              )
            )
          )
      `);

        if (duplicate.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'ALMACEN_ALREADY_EXISTS',
                    message:
                        'Ya existe un almacén con ese código o nombre en la sucursal.',
                },
            });
        }

        const result = await pool
            .request()
            .input('idSucursal', sql.Int, data.idSucursal)
            .input('nombre', sql.VarChar(100), data.nombre)
            .input('codigo', sql.VarChar(30), data.codigo)
            .input('direccion', sql.VarChar(200), data.direccion)
            .input('ciudad', sql.VarChar(100), data.ciudad)
            .input(
                'responsable',
                sql.VarChar(150),
                data.responsable
            )
            .input('telefono', sql.VarChar(20), data.telefono)
            .input(
                'tipoAlmacen',
                sql.VarChar(50),
                data.tipoAlmacen
            )
            .query(`
        INSERT INTO Almacen (
          id_sucursal,
          nombre,
          codigo_almacen,
          direccion,
          ciudad,
          responsable,
          telefono,
          tipo_almacen
        )
        OUTPUT INSERTED.id_almacen
        VALUES (
          @idSucursal,
          @nombre,
          @codigo,
          @direccion,
          @ciudad,
          @responsable,
          @telefono,
          @tipoAlmacen
        )
      `);

        const idCreado = result.recordset[0].id_almacen;

        return res.status(201).json({
            success: true,
            message: 'Almacén creado correctamente.',
            data: {
                id: String(idCreado),
                idAlmacen: idCreado,
            },
        });
    } catch (err) {
        console.error('Error creando almacén:', err);

        return res.status(500).json({
            success: false,
            error: {
                code: 'ALMACEN_CREATE_ERROR',
                message: 'No se pudo crear el almacén.',
                details:
                    process.env.NODE_ENV === 'development'
                        ? err.message
                        : undefined,
            },
        });
    }
});

// ============================================================
// actualizar los datos del alamacen
// ============================================================
router.put('/:id', async (req, res) => {
    const idAlmacen = parseId(req.params.id);

    if (!idAlmacen) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ALMACEN_ID',
                message: 'El identificador del almacén no es válido.',
            },
        });
    }

    const validation = validateAlmacen(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'ALMACEN_VALIDATION_ERROR',
                message: validation.errors[0],
                details: validation.errors,
            },
        });
    }

    const data = validation.data;

    try {
        const pool = await getConnection();

        if (!(await existeSucursal(pool, data.idSucursal))) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'SUCURSAL_NOT_FOUND',
                    message: 'La sucursal seleccionada no existe.',
                },
            });
        }

        const duplicate = await pool
            .request()
            .input('idAlmacen', sql.Int, idAlmacen)
            .input('codigo', sql.VarChar(30), data.codigo)
            .input('nombre', sql.VarChar(100), data.nombre)
            .input('idSucursal', sql.Int, data.idSucursal)
            .query(`
        SELECT id_almacen
        FROM Almacen
        WHERE
          id_almacen <> @idAlmacen
          AND (
            codigo_almacen = @codigo
            OR (
              nombre = @nombre
              AND (
                id_sucursal = @idSucursal
                OR (
                  id_sucursal IS NULL
                  AND @idSucursal IS NULL
                )
              )
            )
          )
      `);

        if (duplicate.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'ALMACEN_ALREADY_EXISTS',
                    message:
                        'Ya existe otro almacén con ese código o nombre en la sucursal.',
                },
            });
        }

        const result = await pool
            .request()
            .input('idAlmacen', sql.Int, idAlmacen)
            .input('idSucursal', sql.Int, data.idSucursal)
            .input('nombre', sql.VarChar(100), data.nombre)
            .input('codigo', sql.VarChar(30), data.codigo)
            .input('direccion', sql.VarChar(200), data.direccion)
            .input('ciudad', sql.VarChar(100), data.ciudad)
            .input(
                'responsable',
                sql.VarChar(150),
                data.responsable
            )
            .input('telefono', sql.VarChar(20), data.telefono)
            .input(
                'tipoAlmacen',
                sql.VarChar(50),
                data.tipoAlmacen
            )
            .query(`
        UPDATE Almacen
        SET
          id_sucursal = @idSucursal,
          nombre = @nombre,
          codigo_almacen = @codigo,
          direccion = @direccion,
          ciudad = @ciudad,
          responsable = @responsable,
          telefono = @telefono,
          tipo_almacen = @tipoAlmacen
        OUTPUT INSERTED.id_almacen
        WHERE id_almacen = @idAlmacen
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ALMACEN_NOT_FOUND',
                    message: 'Almacén no encontrado.',
                },
            });
        }

        return res.json({
            success: true,
            message: 'Almacén actualizado correctamente.',
            data: {
                id: String(idAlmacen),
                idAlmacen,
            },
        });
    } catch (err) {
        console.error('Error actualizando almacén:', err);

        return res.status(500).json({
            success: false,
            error: {
                code: 'ALMACEN_UPDATE_ERROR',
                message: 'No se pudo actualizar el almacén.',
                details:
                    process.env.NODE_ENV === 'development'
                        ? err.message
                        : undefined,
            },
        });
    }
});

// ============================================================
// eliminar un almacen que en si solo lo desactiva
// ============================================================
router.patch('/:id/estado', async (req, res) => {
    const idAlmacen = parseId(req.params.id);
    const estado = normalizeText(
        req.body.estado ?? req.body.status
    );

    if (!idAlmacen) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ALMACEN_ID',
                message: 'El identificador del almacén no es válido.',
            },
        });
    }

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ALMACEN_STATUS',
                message:
                    'El estado debe ser "Activo" o "Inactivo".',
            },
        });
    }

    try {
        const pool = await getConnection();

        const result = await pool
            .request()
            .input('idAlmacen', sql.Int, idAlmacen)
            .input('estado', sql.VarChar(20), estado)
            .query(`
        UPDATE Almacen
        SET estado = @estado
        OUTPUT
          INSERTED.id_almacen,
          INSERTED.estado
        WHERE id_almacen = @idAlmacen
      `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ALMACEN_NOT_FOUND',
                    message: 'Almacén no encontrado.',
                },
            });
        }

        return res.json({
            success: true,
            message: `Almacén marcado como ${estado}.`,
            data: {
                id: String(result.recordset[0].id_almacen),
                estado: result.recordset[0].estado,
            },
        });
    } catch (err) {
        console.error('Error cambiando estado del almacén:', err);

        return res.status(500).json({
            success: false,
            error: {
                code: 'ALMACEN_STATUS_ERROR',
                message:
                    'No se pudo cambiar el estado del almacén.',
                details:
                    process.env.NODE_ENV === 'development'
                        ? err.message
                        : undefined,
            },
        });
    }
});

module.exports = router;