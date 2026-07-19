/**
 * Catálogo de apoyo para el POS (selección UI).
 * IDs alineados al seed Joselito / backend Ventas.
 * La emisión y el total definitivo los define la API.
 */
export interface PosCatalogProduct {
  id: string
  titulo: string
  precioSugerido: number
  moneda: 'DOP'
}

export const POS_CATALOG: PosCatalogProduct[] = [
  { id: 'prod-cien', titulo: 'Cien años de soledad', precioSugerido: 1200, moneda: 'DOP' },
  { id: 'prod-1984', titulo: '1984', precioSugerido: 895, moneda: 'DOP' },
  { id: 'prod-dune', titulo: 'Dune', precioSugerido: 1500, moneda: 'DOP' },
  { id: 'prod-principito', titulo: 'El principito', precioSugerido: 650, moneda: 'DOP' },
  { id: 'prod-mate5', titulo: 'Manual de Matemática 5to Primaria', precioSugerido: 450, moneda: 'DOP' },
  { id: 'prod-cuaderno', titulo: 'Cuaderno cuadriculado 100 hojas', precioSugerido: 120, moneda: 'DOP' },
  { id: 'prod-naruto-5', titulo: 'Naruto Tomo 5', precioSugerido: 900, moneda: 'DOP' },
  { id: 'prod-onepiece-109', titulo: 'One Piece Vol.109', precioSugerido: 1200, moneda: 'DOP' },
]

export const POS_DEFAULTS = {
  sucursalId: 'suc-central',
  almacenId: 'alm-central',
  moneda: 'DOP' as const,
}
