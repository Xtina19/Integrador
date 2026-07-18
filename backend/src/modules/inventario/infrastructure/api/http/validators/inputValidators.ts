function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError(`${field} es obligatorio.`)
  }
  return value.trim()
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ValidationError(`${field} debe ser numérico.`)
  }
  return value
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export function validateCrearTransferencia(body: unknown) {
  const b = body as Record<string, unknown>
  const lineas = b.lineas
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new ValidationError('lineas es obligatorio y no puede estar vacío.')
  }
  return {
    codigo: requireString(b.codigo, 'codigo'),
    almacenOrigenId: requireString(b.almacenOrigenId, 'almacenOrigenId'),
    almacenDestinoId: requireString(b.almacenDestinoId, 'almacenDestinoId'),
    observacion: typeof b.observacion === 'string' ? b.observacion : undefined,
    solicitar: typeof b.solicitar === 'boolean' ? b.solicitar : undefined,
    lineas: lineas.map((l, i) => {
      const row = l as Record<string, unknown>
      return {
        productoId: requireString(row.productoId, `lineas[${i}].productoId`),
        cantidadSolicitada: requireNumber(
          row.cantidadSolicitada,
          `lineas[${i}].cantidadSolicitada`,
        ),
      }
    }),
  }
}

export function validateDespachar(body: unknown) {
  const b = body as Record<string, unknown>
  return {
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
    idempotencyKey: requireString(b.idempotencyKey, 'idempotencyKey'),
  }
}

export function validateRecibir(body: unknown) {
  const b = body as Record<string, unknown>
  const recepciones = b.recepciones
  if (!Array.isArray(recepciones) || recepciones.length === 0) {
    throw new ValidationError('recepciones es obligatorio.')
  }
  return {
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
    idempotencyKey: requireString(b.idempotencyKey, 'idempotencyKey'),
    recepciones: recepciones.map((r, i) => {
      const row = r as Record<string, unknown>
      return {
        lineaId: requireString(row.lineaId, `recepciones[${i}].lineaId`),
        cantidadRecibida: requireNumber(
          row.cantidadRecibida,
          `recepciones[${i}].cantidadRecibida`,
        ),
        cantidadFaltante:
          row.cantidadFaltante === undefined
            ? undefined
            : requireNumber(row.cantidadFaltante, `recepciones[${i}].cantidadFaltante`),
        cantidadDanada:
          row.cantidadDanada === undefined
            ? undefined
            : requireNumber(row.cantidadDanada, `recepciones[${i}].cantidadDanada`),
      }
    }),
  }
}

export function validateCrearDescarte(body: unknown) {
  const b = body as Record<string, unknown>
  const lineas = b.lineas
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new ValidationError('lineas es obligatorio.')
  }
  return {
    codigo: requireString(b.codigo, 'codigo'),
    almacenId: requireString(b.almacenId, 'almacenId'),
    observacion: typeof b.observacion === 'string' ? b.observacion : undefined,
    lineas: lineas.map((l, i) => {
      const row = l as Record<string, unknown>
      return {
        productoId: requireString(row.productoId, `lineas[${i}].productoId`),
        cantidad: requireNumber(row.cantidad, `lineas[${i}].cantidad`),
        motivoCodigo: requireString(row.motivoCodigo, `lineas[${i}].motivoCodigo`),
        observacion: typeof row.observacion === 'string' ? row.observacion : undefined,
      }
    }),
  }
}

export function validateCrearDescarteCompleto(body: unknown) {
  const b = body as Record<string, unknown>
  const motivoCodigo = requireString(b.motivoCodigo, 'motivoCodigo')
  const motivos = [
    'DANO_FISICO',
    'DONACION',
    'PERDIDA',
    'ROBO',
    'ERROR_RECEPCION',
    'PRODUCTO_DEFECTUOSO',
    'CADUCIDAD',
    'OTRO',
  ]
  if (!motivos.includes(motivoCodigo)) {
    throw new ValidationError('motivoCodigo inválido.')
  }
  if (!Array.isArray(b.lineas) || b.lineas.length === 0) {
    throw new ValidationError('lineas es obligatorio.')
  }
  const lineas = b.lineas.map((l, i) => {
    const row = l as Record<string, unknown>
    return {
      productoId: requireString(row.productoId, `lineas[${i}].productoId`),
      isbn: typeof row.isbn === 'string' ? row.isbn : undefined,
      titulo: typeof row.titulo === 'string' ? row.titulo : undefined,
      existenciaActual: requireNumber(row.existenciaActual, `lineas[${i}].existenciaActual`),
      cantidad: requireNumber(row.cantidad, `lineas[${i}].cantidad`),
      costo: requireNumber(row.costo ?? 0, `lineas[${i}].costo`),
      motivoEspecifico:
        typeof row.motivoEspecifico === 'string' ? row.motivoEspecifico : undefined,
      observacion: typeof row.observacion === 'string' ? row.observacion : undefined,
    }
  })
  const evidencias = Array.isArray(b.evidencias)
    ? b.evidencias.map((e, i) => {
        const row = e as Record<string, unknown>
        const tipo = requireString(row.tipo, `evidencias[${i}].tipo`)
        if (!['fotografia', 'pdf', 'acta', 'documento', 'comentario'].includes(tipo)) {
          throw new ValidationError(`evidencias[${i}].tipo inválido.`)
        }
        return {
          tipo: tipo as 'fotografia' | 'pdf' | 'acta' | 'documento' | 'comentario',
          nombreArchivo: typeof row.nombreArchivo === 'string' ? row.nombreArchivo : undefined,
          urlReferencia: typeof row.urlReferencia === 'string' ? row.urlReferencia : undefined,
          comentario: typeof row.comentario === 'string' ? row.comentario : undefined,
        }
      })
    : []

  return {
    codigo: typeof b.codigo === 'string' ? b.codigo : undefined,
    fecha: requireString(b.fecha, 'fecha'),
    sucursalId: requireString(b.sucursalId, 'sucursalId'),
    almacenId: requireString(b.almacenId, 'almacenId'),
    responsableNombre:
      typeof b.responsableNombre === 'string' ? b.responsableNombre : undefined,
    observaciones: typeof b.observaciones === 'string' ? b.observaciones : undefined,
    motivoCodigo: motivoCodigo as
      | 'DANO_FISICO'
      | 'DONACION'
      | 'PERDIDA'
      | 'ROBO'
      | 'ERROR_RECEPCION'
      | 'PRODUCTO_DEFECTUOSO'
      | 'CADUCIDAD'
      | 'OTRO',
    motivoDescripcion:
      typeof b.motivoDescripcion === 'string' ? b.motivoDescripcion : undefined,
    lineas,
    evidencias,
    requiereAprobacion: b.requiereAprobacion !== false,
    supervisorId: typeof b.supervisorId === 'string' ? b.supervisorId : undefined,
    supervisorNombre:
      typeof b.supervisorNombre === 'string' ? b.supervisorNombre : undefined,
  }
}

export function validateAprobar(body: unknown) {
  const b = body as Record<string, unknown>
  return {
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
  }
}

export function validateAplicar(body: unknown) {
  const b = body as Record<string, unknown>
  return {
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
    idempotencyKey: requireString(b.idempotencyKey, 'idempotencyKey'),
    permitirAlmacenBloqueadoPorConteoId:
      typeof b.permitirAlmacenBloqueadoPorConteoId === 'string'
        ? b.permitirAlmacenBloqueadoPorConteoId
        : undefined,
  }
}

export function validateCrearConteo(body: unknown) {
  const b = body as Record<string, unknown>
  const tipo = requireString(b.tipoConteo, 'tipoConteo')
  if (!['general', 'parcial', 'ciclico', 'extraordinario'].includes(tipo)) {
    throw new ValidationError('tipoConteo inválido.')
  }
  return {
    codigo: requireString(b.codigo, 'codigo'),
    almacenId: requireString(b.almacenId, 'almacenId'),
    tipoConteo: tipo as 'general' | 'parcial' | 'ciclico' | 'extraordinario',
    descripcionAlcance: requireString(b.descripcionAlcance, 'descripcionAlcance'),
  }
}

export function validateCrearConteoCompleto(body: unknown) {
  const b = body as Record<string, unknown>
  const tipo = requireString(b.tipoConteo, 'tipoConteo')
  if (!['general', 'parcial', 'ciclico', 'extraordinario'].includes(tipo)) {
    throw new ValidationError('tipoConteo inválido.')
  }
  const alcanceTipo = requireString(b.alcanceTipo, 'alcanceTipo')
  if (
    !['todo_almacen', 'categoria', 'editorial', 'ubicacion', 'productos'].includes(alcanceTipo)
  ) {
    throw new ValidationError('alcanceTipo inválido.')
  }
  if (!Array.isArray(b.productos) || b.productos.length === 0) {
    throw new ValidationError('productos del alcance es obligatorio.')
  }
  const productos = b.productos.map((p, i) => {
    const row = p as Record<string, unknown>
    return {
      productoId: requireString(row.productoId, `productos[${i}].productoId`),
      isbn: typeof row.isbn === 'string' ? row.isbn : undefined,
      titulo: typeof row.titulo === 'string' ? row.titulo : undefined,
      categoria: typeof row.categoria === 'string' ? row.categoria : undefined,
      editorial: typeof row.editorial === 'string' ? row.editorial : undefined,
      ubicacion: typeof row.ubicacion === 'string' ? row.ubicacion : undefined,
      existenciaActual: requireNumber(row.existenciaActual ?? 0, `productos[${i}].existenciaActual`),
      stockMinimo: requireNumber(row.stockMinimo ?? 0, `productos[${i}].stockMinimo`),
    }
  })

  return {
    codigo: typeof b.codigo === 'string' ? b.codigo : undefined,
    nombre: requireString(b.nombre, 'nombre'),
    tipoConteo: tipo as 'general' | 'parcial' | 'ciclico' | 'extraordinario',
    sucursalId: requireString(b.sucursalId, 'sucursalId'),
    almacenId: requireString(b.almacenId, 'almacenId'),
    alcanceTipo: alcanceTipo as
      | 'todo_almacen'
      | 'categoria'
      | 'editorial'
      | 'ubicacion'
      | 'productos',
    alcanceValor: typeof b.alcanceValor === 'string' ? b.alcanceValor : undefined,
    fechaProgramada: typeof b.fechaProgramada === 'string' ? b.fechaProgramada : undefined,
    horaProgramada: typeof b.horaProgramada === 'string' ? b.horaProgramada : undefined,
    responsableNombre:
      typeof b.responsableNombre === 'string' ? b.responsableNombre : undefined,
    observaciones: typeof b.observaciones === 'string' ? b.observaciones : undefined,
    bloquearAlmacenAlAbrir: b.bloquearAlmacenAlAbrir !== false,
    permitirReconteo: b.permitirReconteo !== false,
    diferenciaMinimaReconteo: requireNumber(
      b.diferenciaMinimaReconteo ?? 1,
      'diferenciaMinimaReconteo',
    ),
    productos,
  }
}

export function validateIniciarReconteo(body: unknown) {
  const b = body as Record<string, unknown>
  return {
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
    lineaIds: Array.isArray(b.lineaIds)
      ? b.lineaIds.map((l, i) => requireString(l, `lineaIds[${i}]`))
      : undefined,
  }
}

export function validateAbrirConteo(body: unknown) {
  const b = body as Record<string, unknown>
  return {
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
    productoIds: Array.isArray(b.productoIds)
      ? b.productoIds.map((p, i) => requireString(p, `productoIds[${i}]`))
      : undefined,
  }
}

export function validateRegistrarLinea(body: unknown) {
  const b = body as Record<string, unknown>
  return {
    cantidadContada: requireNumber(b.cantidadContada, 'cantidadContada'),
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
  }
}

export function validateClasificar(body: unknown) {
  const b = body as Record<string, unknown>
  const clasificacion = requireString(b.clasificacion, 'clasificacion')
  if (!['cuadra', 'sobrante', 'faltante', 'dano', 'investigacion'].includes(clasificacion)) {
    throw new ValidationError('clasificacion inválida.')
  }
  let regularizacion: { tipo: 'ajuste' | 'descarte'; id: string } | undefined
  if (b.regularizacion && typeof b.regularizacion === 'object') {
    const r = b.regularizacion as Record<string, unknown>
    const tipo = requireString(r.tipo, 'regularizacion.tipo')
    if (tipo !== 'ajuste' && tipo !== 'descarte') {
      throw new ValidationError('regularizacion.tipo inválido.')
    }
    regularizacion = {
      tipo,
      id: requireString(r.id, 'regularizacion.id'),
    }
  }
  return {
    expectedVersion: requireNumber(b.expectedVersion, 'expectedVersion'),
    clasificacion: clasificacion as
      | 'cuadra'
      | 'sobrante'
      | 'faltante'
      | 'dano'
      | 'investigacion',
    regularizacion,
  }
}

export function validateCrearAjuste(body: unknown) {
  const b = body as Record<string, unknown>
  const tipo = requireString(b.tipoAjuste, 'tipoAjuste')
  if (!['positivo', 'negativo', 'digitacion', 'conteo', 'error_documental'].includes(tipo)) {
    throw new ValidationError('tipoAjuste inválido.')
  }
  const lineas = b.lineas
  if (!Array.isArray(lineas) || lineas.length === 0) {
    throw new ValidationError('lineas es obligatorio.')
  }
  return {
    codigo: requireString(b.codigo, 'codigo'),
    almacenId: requireString(b.almacenId, 'almacenId'),
    tipoAjuste: tipo as
      | 'positivo'
      | 'negativo'
      | 'digitacion'
      | 'conteo'
      | 'error_documental',
    observacion: typeof b.observacion === 'string' ? b.observacion : undefined,
    solicitar: typeof b.solicitar === 'boolean' ? b.solicitar : undefined,
    lineas: lineas.map((l, i) => {
      const row = l as Record<string, unknown>
      return {
        productoId: requireString(row.productoId, `lineas[${i}].productoId`),
        cantidadObjetivo: requireNumber(row.cantidadObjetivo, `lineas[${i}].cantidadObjetivo`),
        diferencia: requireNumber(row.diferencia, `lineas[${i}].diferencia`),
        motivoCodigo:
          typeof row.motivoCodigo === 'string' ? row.motivoCodigo : undefined,
        lineaConteoId:
          typeof row.lineaConteoId === 'string' ? row.lineaConteoId : undefined,
        observacion: typeof row.observacion === 'string' ? row.observacion : undefined,
      }
    }),
  }
}
