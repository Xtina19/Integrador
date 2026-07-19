/**
 * Catálogo POS = subset del Master Data (mismos títulos/precios que `productos`).
 * No duplica artículos: IDs de dominio mapean al maestro ERP vía ventas_ref / Engine.
 */
export interface PosCatalogProduct {
  id: string
  titulo: string
  precioSugerido: number
  moneda: 'DOP' | 'USD' | 'EUR'
}

export const POS_CATALOG: PosCatalogProduct[] = [
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

export const POS_DEFAULTS = {
  sucursalId: 'suc-central',
  almacenId: 'alm-central',
  moneda: 'DOP' as const,
}
