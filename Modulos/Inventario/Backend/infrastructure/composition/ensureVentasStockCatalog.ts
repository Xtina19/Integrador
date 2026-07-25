import type { InMemoryDatabaseAdapter } from '../persistence/InMemoryDatabaseAdapter'

/**
 * Catálogo vendible POS / Ventas — alineado al Master Data (`productos`).
 * Mismos títulos/precios; sin papelería.
 */
const PRODUCTOS_VENTAS = [
  { id: 'prod-cien', titulo: 'Cien años de soledad', costoReferencia: 895 },
  { id: 'prod-sombra', titulo: 'La sombra del viento', costoReferencia: 780 },
  { id: 'prod-quijote', titulo: 'Don Quijote de la Mancha', costoReferencia: 950 },
  { id: 'prod-principito', titulo: 'El Principito', costoReferencia: 550 },
  { id: 'prod-habitos', titulo: 'Hábitos Atómicos', costoReferencia: 1150 },
  { id: 'prod-padre', titulo: 'Padre Rico Padre Pobre', costoReferencia: 990 },
  { id: 'prod-cleancode', titulo: 'Clean Code', costoReferencia: 1850 },
  { id: 'prod-hp', titulo: 'Harry Potter y la piedra filosofal', costoReferencia: 850 },
  { id: 'prod-onepiece', titulo: 'One Piece Vol. 1', costoReferencia: 425 },
  { id: 'prod-naruto', titulo: 'Naruto Vol. 1', costoReferencia: 425 },
  { id: 'prod-jujutsu', titulo: 'Jujutsu Kaisen Vol. 1', costoReferencia: 450 },
  { id: 'prod-1984', titulo: '1984', costoReferencia: 595 },
  { id: 'prod-spiderman', titulo: 'Amazing Spider-Man Vol. 1', costoReferencia: 720 },
  { id: 'prod-batman', titulo: 'Batman: Año Uno', costoReferencia: 760 },
  { id: 'prod-matilda', titulo: 'Matilda', costoReferencia: 650 },
  { id: 'prod-booklight', titulo: 'Book light LED clip', costoReferencia: 450 },
] as const

const ALMACENES_VENTAS = ['alm-central', 'alm-polanco', 'alm-santiago'] as const

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
