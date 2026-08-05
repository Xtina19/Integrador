/**
 * Seeder "Joselito" — catálogo operativo realista para demos/pruebas manuales
 * del módulo Inventario de LibroSys (librería dominicana).
 *
 * Genera:
 *  - Catálogo de ~50 productos (libros + papelería) con editoriales, autores y
 *    categorías reales, costos en RD$ enteros (sin centavos).
 *  - Existencias por almacén (central + 5 sucursales).
 *  - Documentos de ejemplo (transferencias, ajustes, descartes, conteos,
 *    movimientos, auditorías) rehidratados vía los agregados de dominio y
 *    persistidos con los repositorios existentes, para que los listados/
 *    dashboards no aparezcan vacíos en un ambiente recién levantado.
 */
import { Ajuste } from '../../domain/aggregates/Ajuste'
import { ConteoFisico } from '../../domain/aggregates/ConteoFisico'
import { Descarte } from '../../domain/aggregates/Descarte'
import { Transferencia } from '../../domain/aggregates/Transferencia'
import { AuditoriaMovimiento } from '../../domain/entities/AuditoriaMovimiento'
import { Kardex } from '../../domain/entities/Kardex'
import { MovimientoInventario } from '../../domain/entities/MovimientoInventario'
import { Cantidad } from '../../domain/value-objects/Cantidad'
import { DocumentoOrigenRef } from '../../domain/value-objects/DocumentoOrigenRef'
import { IdempotencyKey } from '../../domain/value-objects/IdempotencyKey'
import { Saldo } from '../../domain/value-objects/Saldo'
import {
  IAjusteRepository,
  IAuditoriaInventarioRepository,
  IConteoFisicoRepository,
  IDescarteRepository,
  IKardexRepository,
  IMovimientoInventarioRepository,
  ITransferenciaRepository,
} from '../../application/ports/outbound'
import { InMemoryDatabaseAdapter } from '../persistence/InMemoryDatabaseAdapter'

export const ALMACENES_JOSELITO = ['central', 'suc-1', 'suc-2', 'suc-3', 'suc-4', 'suc-5'] as const

interface CatalogoItem {
  isbn: string
  titulo: string
  autor: string
  categoria: string
  editorial: string
  costoReferencia: number
}

const COSTOS_DOP = [650, 895, 1200, 1500, 2500, 3500] as const

const CATALOGO: CatalogoItem[] = [
  { titulo: 'Cien años de soledad', autor: 'Gabriel García Márquez', categoria: 'Literatura', editorial: 'Penguin Random House' },
  { titulo: 'La casa de los espíritus', autor: 'Isabel Allende', categoria: 'Literatura', editorial: 'Penguin Random House' },
  { titulo: 'Rayuela', autor: 'Julio Cortázar', categoria: 'Literatura', editorial: 'Alfaguara' },
  { titulo: 'Pedro Páramo', autor: 'Juan Rulfo', categoria: 'Literatura', editorial: 'Planeta' },
  { titulo: 'La fiesta del Chivo', autor: 'Mario Vargas Llosa', categoria: 'Literatura', editorial: 'Alfaguara' },
  { titulo: 'El otoño del patriarca', autor: 'Gabriel García Márquez', categoria: 'Literatura', editorial: 'Penguin Random House' },
  { titulo: 'Ficciones', autor: 'Jorge Luis Borges', categoria: 'Literatura', editorial: 'Alianza Editorial' },
  { titulo: 'La ciudad y los perros', autor: 'Mario Vargas Llosa', categoria: 'Literatura', editorial: 'Alfaguara' },
  { titulo: 'Como agua para chocolate', autor: 'Laura Esquivel', categoria: 'Literatura', editorial: 'Planeta' },
  { titulo: 'El túnel', autor: 'Ernesto Sabato', categoria: 'Literatura', editorial: 'Seix Barral' },
  { titulo: 'In the Time of the Butterflies', autor: 'Julia Álvarez', categoria: 'Literatura', editorial: 'Ediciones de la UASD' },
  { titulo: 'Over', autor: 'Ramón Marrero Aristy', categoria: 'Literatura', editorial: 'Ediciones de la UASD' },
  { titulo: 'Enriquillo', autor: 'Manuel de Jesús Galván', categoria: 'Literatura', editorial: 'Ediciones de la UASD' },
  { titulo: 'La maravillosa vida breve de Óscar Wao', autor: 'Junot Díaz', categoria: 'Literatura', editorial: 'Norma' },
  { titulo: 'Cuentos escritos en el exilio', autor: 'Juan Bosch', categoria: 'Literatura', editorial: 'Ediciones de la UASD' },
  { titulo: 'La mujer habitada', autor: 'Gioconda Belli', categoria: 'Literatura', editorial: 'Norma' },
  { titulo: 'El principito', autor: 'Antoine de Saint-Exupéry', categoria: 'Infantil', editorial: 'Salamandra' },
  { titulo: 'Charlie y la fábrica de chocolate', autor: 'Roald Dahl', categoria: 'Infantil', editorial: 'Santillana' },
  { titulo: 'Matilda', autor: 'Roald Dahl', categoria: 'Infantil', editorial: 'Santillana' },
  { titulo: 'El diario de Greg', autor: 'Jeff Kinney', categoria: 'Infantil', editorial: 'Planeta' },
  { titulo: 'Cuentos de Buen Provecho', autor: 'Fabio Fiallo', categoria: 'Infantil', editorial: 'Ediciones de la UASD' },
  { titulo: 'Platero y yo', autor: 'Juan Ramón Jiménez', categoria: 'Infantil', editorial: 'SM' },
  { titulo: 'Las aventuras de Pinocho', autor: 'Carlo Collodi', categoria: 'Infantil', editorial: 'SM' },
  { titulo: 'El gato con botas', autor: 'Charles Perrault', categoria: 'Infantil', editorial: 'SM' },
  { titulo: 'Manual de Matemática 5to Primaria', autor: 'Equipo Editorial Santillana', categoria: 'Texto escolar', editorial: 'Santillana' },
  { titulo: 'Lengua Española 6to Primaria', autor: 'Equipo Editorial SM', categoria: 'Texto escolar', editorial: 'SM' },
  { titulo: 'Ciencias Naturales 4to Primaria', autor: 'Equipo Editorial Norma', categoria: 'Texto escolar', editorial: 'Norma' },
  { titulo: 'Historia Dominicana 8vo', autor: 'Frank Moya Pons', categoria: 'Texto escolar', editorial: 'Ediciones de la UASD' },
  { titulo: 'Geografía Universal 7mo', autor: 'Equipo Editorial Santillana', categoria: 'Texto escolar', editorial: 'Santillana' },
  { titulo: 'Inglés Básico 1ro Secundaria', autor: 'Equipo Editorial SM', categoria: 'Texto escolar', editorial: 'SM' },
  { titulo: 'Matemática 1ro Secundaria', autor: 'Equipo Editorial Santillana', categoria: 'Texto escolar', editorial: 'Santillana' },
  { titulo: 'Formación Humana y Religiosa 3ro', autor: 'Equipo Editorial Norma', categoria: 'Texto escolar', editorial: 'Norma' },
  { titulo: 'Física General 2do Secundaria', autor: 'Equipo Editorial Santillana', categoria: 'Texto escolar', editorial: 'Santillana' },
  { titulo: 'Diccionario de la Lengua Española', autor: 'Real Academia Española', categoria: 'Referencia', editorial: 'Espasa' },
  { titulo: 'Atlas Geográfico Mundial', autor: 'Equipo Editorial Norma', categoria: 'Referencia', editorial: 'Norma' },
  { titulo: 'Enciclopedia de la República Dominicana', autor: 'Frank Moya Pons', categoria: 'Referencia', editorial: 'Ediciones de la UASD' },
  { titulo: 'Manual de Ortografía y Gramática', autor: 'Equipo Editorial SM', categoria: 'Referencia', editorial: 'SM' },
  { titulo: 'Diccionario Inglés-Español', autor: 'Equipo Editorial Larousse', categoria: 'Referencia', editorial: 'Larousse' },
  { titulo: 'Constitución de la República Dominicana', autor: 'Congreso Nacional', categoria: 'Referencia', editorial: 'Ediciones de la UASD' },
  { titulo: 'Cuaderno cuadriculado 100 hojas', autor: 'N/A', categoria: 'Papelería', editorial: 'Norma' },
  { titulo: 'Cuaderno rayado 80 hojas', autor: 'N/A', categoria: 'Papelería', editorial: 'Norma' },
  { titulo: 'Set de lápices de colores (24u)', autor: 'N/A', categoria: 'Papelería', editorial: 'Norma' },
  { titulo: 'Marcadores permanentes (12u)', autor: 'N/A', categoria: 'Papelería', editorial: 'SM' },
  { titulo: 'Resma de papel bond carta', autor: 'N/A', categoria: 'Papelería', editorial: 'Norma' },
  { titulo: 'Carpeta plástica con gancho', autor: 'N/A', categoria: 'Papelería', editorial: 'Norma' },
  { titulo: 'Juego de reglas geométricas', autor: 'N/A', categoria: 'Papelería', editorial: 'SM' },
  { titulo: 'Calculadora científica básica', autor: 'N/A', categoria: 'Papelería', editorial: 'SM' },
  { titulo: 'Mochila escolar reforzada', autor: 'N/A', categoria: 'Papelería', editorial: 'Norma' },
  { titulo: 'Estuche escolar completo', autor: 'N/A', categoria: 'Papelería', editorial: 'Norma' },
].map((item, index) => ({
  ...item,
  isbn: `978-9945-${String(100 + index).padStart(3, '0')}-${String((index * 7) % 10)}`,
  costoReferencia: COSTOS_DOP[index % COSTOS_DOP.length],
}))

function existenciaPorAlmacen(index: number, almacenIdx: number): number {
  // Distribución determinista y creíble: central concentra más stock.
  if (almacenIdx === 0) return 30 + ((index * 5) % 60)
  return 5 + ((index + almacenIdx * 3) % 25)
}

export interface SeedJoselitoRepos {
  db: InMemoryDatabaseAdapter
  transferencias: ITransferenciaRepository
  ajustes: IAjusteRepository
  descartes: IDescarteRepository
  conteos: IConteoFisicoRepository
  movimientos: IMovimientoInventarioRepository
  kardex: IKardexRepository
  auditorias: IAuditoriaInventarioRepository
}

/** Semilla operativa rica ("Joselito"): catálogo + existencias + documentos de ejemplo. */
export function seedInventarioJoselito(repos: SeedJoselitoRepos): void {
  const { db } = repos
  const now = new Date('2026-07-01T12:00:00.000Z')

  for (const id of ALMACENES_JOSELITO) {
    if (!db.tables.almacenes.has(id)) {
      db.seedAlmacen({ id, bloqueadoPorConteo: false })
    }
  }

  CATALOGO.forEach((item, index) => {
    const productoId = `prod-jsl-${String(index + 1).padStart(3, '0')}`
    db.seedProducto({
      id: productoId,
      codigo: `LIB-${String(index + 1).padStart(4, '0')}`,
      isbn: item.isbn,
      titulo: item.titulo,
      autor: item.autor,
      categoria: item.categoria,
      editorial: item.editorial,
      costoReferencia: item.costoReferencia,
      activo: true,
    })

    ALMACENES_JOSELITO.forEach((almacenId, almacenIdx) => {
      db.seedExistencia({
        id: `ex-jsl-${index + 1}-${almacenIdx + 1}`,
        productoId,
        almacenId,
        saldo: existenciaPorAlmacen(index, almacenIdx),
        version: 1,
      })
    })
  })

  const productoId = (n: number) => `prod-jsl-${String(n).padStart(3, '0')}`

  // --- Transferencias de ejemplo -------------------------------------------------
  const tr1 = Transferencia.rehidratar({
    id: 'trf-jsl-001',
    codigo: 'TR-JSL-0001',
    almacenOrigenId: 'central',
    almacenDestinoId: 'suc-1',
    estado: 'recibida',
    solicitanteId: 'joselito',
    version: 3,
    lineas: [
      {
        id: 'trf-jsl-001-l1',
        productoId: productoId(1),
        cantidadSolicitada: 10,
        cantidadDespachada: 10,
        cantidadRecibida: 10,
        cantidadFaltante: 0,
        cantidadDanada: 0,
      },
    ],
    observacion: 'Reposición mensual Sucursal Centro.',
  })
  void repos.transferencias.save(tr1)

  const tr2 = Transferencia.rehidratar({
    id: 'trf-jsl-002',
    codigo: 'TR-JSL-0002',
    almacenOrigenId: 'central',
    almacenDestinoId: 'suc-2',
    estado: 'en_transito',
    solicitanteId: 'joselito',
    version: 2,
    lineas: [
      {
        id: 'trf-jsl-002-l1',
        productoId: productoId(17),
        cantidadSolicitada: 8,
        cantidadDespachada: 8,
        cantidadRecibida: 0,
        cantidadFaltante: 0,
        cantidadDanada: 0,
      },
    ],
    observacion: 'Reposición material infantil Sucursal Norte.',
  })
  void repos.transferencias.save(tr2)

  const tr3 = Transferencia.rehidratar({
    id: 'trf-jsl-003',
    codigo: 'TR-JSL-0003',
    almacenOrigenId: 'central',
    almacenDestinoId: 'suc-3',
    estado: 'solicitada',
    solicitanteId: 'joselito',
    version: 1,
    lineas: [
      {
        id: 'trf-jsl-003-l1',
        productoId: productoId(25),
        cantidadSolicitada: 15,
        cantidadDespachada: 0,
        cantidadRecibida: 0,
        cantidadFaltante: 0,
        cantidadDanada: 0,
      },
    ],
    observacion: 'Pedido inicio de año escolar Sucursal Este.',
  })
  void repos.transferencias.save(tr3)

  // --- Ajustes de ejemplo ---------------------------------------------------------
  const aj1 = Ajuste.rehidratar({
    id: 'adj-jsl-001',
    codigo: 'AJ-JSL-0001',
    almacenId: 'central',
    tipoAjuste: 'conteo',
    estado: 'aplicado',
    solicitanteId: 'joselito',
    aprobadorId: 'supervisor-jsl',
    version: 3,
    lineas: [
      {
        id: 'adj-jsl-001-l1',
        productoId: productoId(34),
        cantidadObjetivo: 40,
        diferencia: 4,
        motivoCodigo: 'CONTEO_FISICO',
      },
    ],
    observacion: 'Regularización por diferencia de conteo físico Q2.',
  })
  void repos.ajustes.save(aj1)

  const aj2 = Ajuste.rehidratar({
    id: 'adj-jsl-002',
    codigo: 'AJ-JSL-0002',
    almacenId: 'suc-1',
    tipoAjuste: 'digitacion',
    estado: 'solicitado',
    solicitanteId: 'joselito',
    version: 1,
    lineas: [
      {
        id: 'adj-jsl-002-l1',
        productoId: productoId(2),
        cantidadObjetivo: 22,
        diferencia: -3,
        motivoCodigo: 'ERROR_DIGITACION',
      },
    ],
    observacion: 'Corrección de digitación en recepción.',
  })
  void repos.ajustes.save(aj2)

  // --- Descartes de ejemplo --------------------------------------------------------
  const ds1 = Descarte.rehidratar({
    id: 'dsc-jsl-001',
    codigo: 'DSC-JSL-0001',
    almacenId: 'central',
    estado: 'aplicado',
    solicitanteId: 'joselito',
    aprobadorId: 'supervisor-jsl',
    version: 3,
    lineas: [
      {
        id: 'dsc-jsl-001-l1',
        productoId: productoId(41),
        cantidad: 5,
        motivoCodigo: 'DANO_FISICO',
        observacion: 'Cuadernos dañados por humedad en almacén.',
      },
    ],
    observacion: 'Baja por daño físico en bodega central.',
  })
  void repos.descartes.save(ds1)

  const ds2 = Descarte.rehidratar({
    id: 'dsc-jsl-002',
    codigo: 'DSC-JSL-0002',
    almacenId: 'suc-2',
    estado: 'solicitado',
    solicitanteId: 'joselito',
    version: 1,
    lineas: [
      {
        id: 'dsc-jsl-002-l1',
        productoId: productoId(19),
        cantidad: 2,
        motivoCodigo: 'PRODUCTO_DEFECTUOSO',
      },
    ],
    observacion: 'Ejemplares con encuadernado defectuoso.',
  })
  void repos.descartes.save(ds2)

  // --- Conteos de ejemplo -----------------------------------------------------------
  const snapshotsCerrado = [
    { id: 'snp-jsl-001', productoId: productoId(45), cantidadTeorica: 20 },
  ]
  const cnt1 = ConteoFisico.rehidratar({
    id: 'cnt-jsl-001',
    codigo: 'CF-JSL-0001',
    almacenId: 'suc-4',
    tipoConteo: 'ciclico',
    descripcionAlcance: 'nombre=Conteo cíclico papelería Q2; alcance=categoria; productos=1',
    estado: 'cerrado',
    responsableId: 'joselito',
    bloqueoActivo: false,
    version: 5,
    snapshots: snapshotsCerrado,
    lineas: [
      {
        id: 'cnt-jsl-001-l1',
        productoId: productoId(45),
        snapshotId: 'snp-jsl-001',
        cantidadContada: 20,
        cantidadAceptada: 20,
        diferencia: 0,
        clasificacion: 'cuadra',
        estadoLinea: 'regularizada',
      },
    ],
  })
  void repos.conteos.save(cnt1)

  const snapshotsAbierto = [
    { id: 'snp-jsl-002', productoId: productoId(5), cantidadTeorica: 32 },
    { id: 'snp-jsl-003', productoId: productoId(6), cantidadTeorica: 18 },
  ]
  const cnt2 = ConteoFisico.rehidratar({
    id: 'cnt-jsl-002',
    codigo: 'CF-JSL-0002',
    almacenId: 'suc-5',
    tipoConteo: 'general',
    descripcionAlcance: 'nombre=Conteo general Sucursal Sur; alcance=todo_almacen; productos=2',
    estado: 'abierto',
    responsableId: 'joselito',
    bloqueoActivo: true,
    version: 2,
    snapshots: snapshotsAbierto,
    lineas: [
      { id: 'cnt-jsl-002-l1', productoId: productoId(5), snapshotId: 'snp-jsl-002', estadoLinea: 'pendiente' },
      { id: 'cnt-jsl-002-l2', productoId: productoId(6), snapshotId: 'snp-jsl-003', estadoLinea: 'pendiente' },
    ],
  })
  void repos.conteos.save(cnt2)
  db.tables.almacenes.get('suc-5')!.bloqueadoPorConteo = true
  db.tables.almacenes.get('suc-5')!.conteoBloqueanteId = cnt2.id

  // --- Movimientos + Kardex + Auditoría (documentos "aplicados" arriba) ------------
  registrarMovimientoSeed(repos, {
    id: 'mov-jsl-001',
    tipoMovimiento: 'ajuste',
    productoId: productoId(34),
    almacenId: 'central',
    cantidad: 4,
    saldoAnterior: 36,
    saldoPosterior: 40,
    documento: DocumentoOrigenRef.of('ajuste', aj1.id, 'adj-jsl-001-l1'),
    usuarioId: 'supervisor-jsl',
    fecha: now,
    motivoCodigo: 'CONTEO_FISICO',
  })

  registrarMovimientoSeed(repos, {
    id: 'mov-jsl-002',
    tipoMovimiento: 'descarte',
    productoId: productoId(41),
    almacenId: 'central',
    cantidad: 5,
    saldoAnterior: 45,
    saldoPosterior: 40,
    documento: DocumentoOrigenRef.of('descarte', ds1.id, 'dsc-jsl-001-l1'),
    usuarioId: 'supervisor-jsl',
    fecha: now,
    motivoCodigo: 'DANO_FISICO',
  })

  registrarMovimientoSeed(repos, {
    id: 'mov-jsl-003',
    tipoMovimiento: 'transferencia_salida',
    productoId: productoId(1),
    almacenId: 'central',
    cantidad: 10,
    saldoAnterior: 40,
    saldoPosterior: 30,
    documento: DocumentoOrigenRef.of('transferencia', tr1.id, 'trf-jsl-001-l1'),
    usuarioId: 'joselito',
    fecha: now,
  })

  registrarMovimientoSeed(repos, {
    id: 'mov-jsl-004',
    tipoMovimiento: 'transferencia_entrada',
    productoId: productoId(1),
    almacenId: 'suc-1',
    cantidad: 10,
    saldoAnterior: 5,
    saldoPosterior: 15,
    documento: DocumentoOrigenRef.of('transferencia', tr1.id, 'trf-jsl-001-l1'),
    usuarioId: 'joselito',
    fecha: now,
  })
}

function registrarMovimientoSeed(
  repos: SeedJoselitoRepos,
  input: {
    id: string
    tipoMovimiento: Parameters<typeof MovimientoInventario.registrar>[0]['tipoMovimiento']
    productoId: string
    almacenId: string
    cantidad: number
    saldoAnterior: number
    saldoPosterior: number
    documento: DocumentoOrigenRef
    usuarioId: string
    fecha: Date
    motivoCodigo?: string
  },
): void {
  const movimiento = MovimientoInventario.registrar({
    id: input.id,
    tipoMovimiento: input.tipoMovimiento,
    productoId: input.productoId,
    almacenId: input.almacenId,
    cantidad: Cantidad.positive(input.cantidad),
    saldoAnterior: Saldo.of(input.saldoAnterior),
    saldoPosterior: Saldo.of(input.saldoPosterior),
    documento: input.documento,
    usuarioId: input.usuarioId,
    fechaMovimiento: input.fecha,
    idempotencyKey: IdempotencyKey.of(`seed:${input.id}`),
    motivoCodigo: input.motivoCodigo,
  })
  void repos.movimientos.add(movimiento)

  const kardex = Kardex.desdeMovimiento(`krd-${input.id}`, movimiento)
  void repos.kardex.add(kardex)

  const auditoria = AuditoriaMovimiento.deMovimiento({
    id: `aud-${input.id}`,
    usuarioId: input.usuarioId,
    fecha: input.fecha,
    movimientoId: movimiento.id,
    documentoTipo: movimiento.documento.tipo,
    documentoId: movimiento.documento.id,
    productoId: movimiento.productoId,
    almacenId: movimiento.almacenId,
    valorAntes: { saldo: input.saldoAnterior },
    valorDespues: { saldo: input.saldoPosterior },
    idempotencyKey: movimiento.idempotencyKey.value,
    detalle: `Semilla Joselito: ${input.tipoMovimiento}`,
  })
  void repos.auditorias.add(auditoria)
}
