import type { InMemoryDatabaseAdapter } from '../persistence/InMemoryDatabaseAdapter'

/** Catálogo vendible del POS / seed Ventas — debe existir en el Engine. */
const PRODUCTOS_VENTAS = [
  { id: 'prod-cien', titulo: 'Cien años de soledad', costoReferencia: 1200 },
  { id: 'prod-1984', titulo: '1984', costoReferencia: 895 },
  { id: 'prod-dune', titulo: 'Dune', costoReferencia: 1500 },
  { id: 'prod-principito', titulo: 'El principito', costoReferencia: 650 },
  { id: 'prod-mate5', titulo: 'Manual de Matemática 5to Primaria', costoReferencia: 450 },
  { id: 'prod-cuaderno', titulo: 'Cuaderno cuadriculado 100 hojas', costoReferencia: 120 },
  { id: 'prod-naruto-5', titulo: 'Naruto Tomo 5', costoReferencia: 900 },
  { id: 'prod-onepiece-109', titulo: 'One Piece Vol.109', costoReferencia: 1200 },
] as const

const ALMACENES_VENTAS = ['alm-central', 'alm-polanco'] as const

/**
 * Garantiza productos/almacenes/existencias del canal Ventas en el DB del Engine.
 * Idempotente: no sobrescribe saldos ya existentes.
 */
export function ensureVentasStockCatalog(db: InMemoryDatabaseAdapter): void {
  for (const id of ALMACENES_VENTAS) {
    if (!db.tables.almacenes.has(id)) {
      db.seedAlmacen({ id, bloqueadoPorConteo: false })
    }
  }

  for (const p of PRODUCTOS_VENTAS) {
    if (!db.tables.productos.has(p.id)) {
      db.seedProducto({
        id: p.id,
        activo: true,
        titulo: p.titulo,
        costoReferencia: p.costoReferencia,
      })
    }
    ALMACENES_VENTAS.forEach((almacenId, idx) => {
      const key = `${p.id}::${almacenId}`
      if (db.tables.existencias.has(key)) return
      db.seedExistencia({
        id: `ex-ven-${p.id}-${almacenId}`,
        productoId: p.id,
        almacenId,
        saldo: idx === 0 ? 100 : 50,
        version: 1,
      })
    })
  }
}
