/**
 * Catálogo POS — proyección del Catálogo Maestro (Administración → productos).
 * El fallback estático solo se usa si la API no responde, para no romper el POS.
 */
import type { ProductoMaestro } from '@/hooks/useProductosMaestro'

export interface PosCatalogProduct {
  id: string
  titulo: string
  precioSugerido: number
  moneda: 'DOP' | 'USD' | 'EUR'
  isbn?: string
  codigo?: string
}

/** Fallback operativo (mismos IDs que el seed de Ventas) si el maestro no está disponible. */
export const POS_CATALOG_FALLBACK: PosCatalogProduct[] = [
  { id: 'prod-cien', titulo: 'Cien años de soledad', precioSugerido: 895.0, moneda: 'DOP' },
  { id: 'prod-sombra', titulo: 'La sombra del viento', precioSugerido: 780.0, moneda: 'DOP' },
  { id: 'prod-quijote', titulo: 'Don Quijote de la Mancha', precioSugerido: 950.0, moneda: 'DOP' },
  { id: 'prod-principito', titulo: 'El Principito', precioSugerido: 550.0, moneda: 'DOP' },
  { id: 'prod-habitos', titulo: 'Hábitos Atómicos', precioSugerido: 1150.0, moneda: 'DOP' },
  { id: 'prod-padre', titulo: 'Padre Rico Padre Pobre', precioSugerido: 990.0, moneda: 'DOP' },
  { id: 'prod-cleancode', titulo: 'Clean Code', precioSugerido: 1850.0, moneda: 'DOP' },
  { id: 'prod-hp', titulo: 'Harry Potter y la piedra filosofal', precioSugerido: 850.0, moneda: 'DOP' },
  { id: 'prod-onepiece', titulo: 'One Piece Vol. 1', precioSugerido: 425.0, moneda: 'DOP' },
  { id: 'prod-naruto', titulo: 'Naruto Vol. 1', precioSugerido: 425.0, moneda: 'DOP' },
  { id: 'prod-jujutsu', titulo: 'Jujutsu Kaisen Vol. 1', precioSugerido: 450.0, moneda: 'DOP' },
  { id: 'prod-1984', titulo: '1984', precioSugerido: 595.0, moneda: 'DOP' },
  { id: 'prod-spiderman', titulo: 'Amazing Spider-Man Vol. 1', precioSugerido: 720.0, moneda: 'DOP' },
  { id: 'prod-batman', titulo: 'Batman: Año Uno', precioSugerido: 760.0, moneda: 'DOP' },
  { id: 'prod-matilda', titulo: 'Matilda', precioSugerido: 650.0, moneda: 'DOP' },
  { id: 'prod-booklight', titulo: 'Book light LED clip', precioSugerido: 450.0, moneda: 'DOP' },
]

/** @deprecated Preferir buildPosCatalogDesdeMaestro — alias del fallback. */
export const POS_CATALOG = POS_CATALOG_FALLBACK

export const POS_DEFAULTS = {
  sucursalId: 'suc-central',
  almacenId: 'alm-central',
  moneda: 'DOP' as const,
}

export function mapMaestroToPos(p: ProductoMaestro): PosCatalogProduct {
  const moneda = (p.currency === 'USD' || p.currency === 'EUR' ? p.currency : 'DOP') as
    | 'DOP'
    | 'USD'
    | 'EUR'
  return {
    id: p.id,
    titulo: p.title,
    precioSugerido: p.price,
    moneda,
    isbn: p.isbn,
    codigo: p.code,
  }
}

/**
 * Construye el catálogo POS desde el maestro.
 * Si el maestro está vacío, conserva el fallback para no romper ventas sembradas.
 */
export function buildPosCatalogDesdeMaestro(maestro: ProductoMaestro[]): PosCatalogProduct[] {
  if (!maestro.length) return POS_CATALOG_FALLBACK
  return maestro.map(mapMaestroToPos)
}
