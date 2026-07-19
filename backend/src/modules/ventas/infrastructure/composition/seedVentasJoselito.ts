import type { InMemoryVentasStore } from '../persistence/InMemoryVentasStore'

/** Datos coherentes Joselito (VEN-DATA) alineados al maestro Administración (CLI-######). */
export function seedVentasJoselito(store: InMemoryVentasStore): void {
  store.clientes.set('CLI-000001', {
    id: 'CLI-000001',
    nombre: 'Colegio La Salle',
    activo: true,
  })
  store.clientes.set('CLI-000002', {
    id: 'CLI-000002',
    nombre: 'PUCMM',
    activo: true,
  })
  store.clientes.set('CLI-000003', {
    id: 'CLI-000003',
    nombre: 'UTESA',
    activo: true,
  })
  store.clientes.set('CLI-000004', {
    id: 'CLI-000004',
    nombre: 'María González',
    activo: true,
  })
  store.clientes.set('CLI-000005', {
    id: 'CLI-000005',
    nombre: 'José Ramírez',
    activo: true,
  })
  store.clientes.set('CLI-000006', {
    id: 'CLI-000006',
    nombre: 'Ministerio de Educación',
    activo: true,
  })
  store.clientes.set('CLI-000007', {
    id: 'CLI-000007',
    nombre: 'Distribuidora Papelería Norte',
    activo: false,
  })

  const productos = [
    { id: 'prod-cien', titulo: 'Cien años de soledad', precio: 1200, moneda: 'DOP' },
    { id: 'prod-1984', titulo: '1984', precio: 895, moneda: 'DOP' },
    { id: 'prod-dune', titulo: 'Dune', precio: 1500, moneda: 'DOP' },
    { id: 'prod-principito', titulo: 'El principito', precio: 650, moneda: 'DOP' },
    { id: 'prod-mate5', titulo: 'Manual de Matemática 5to Primaria', precio: 450, moneda: 'DOP' },
    { id: 'prod-cuaderno', titulo: 'Cuaderno cuadriculado 100 hojas', precio: 120, moneda: 'DOP' },
    { id: 'prod-naruto-5', titulo: 'Naruto Tomo 5', precio: 900, moneda: 'DOP' },
    { id: 'prod-onepiece-109', titulo: 'One Piece Vol.109', precio: 1200, moneda: 'DOP' },
  ] as const

  for (const p of productos) {
    store.productos.set(p.id, { ...p, activo: true })
  }

  // Existencias: únicamente en Inventory Engine (no hay stub local).

  store.usuarios.set('usr-cajero', {
    id: 'usr-cajero',
    rol: 'cajero',
    topePorcentajeDescuento: 5,
  })
  store.usuarios.set('usr-supervisor', {
    id: 'usr-supervisor',
    rol: 'supervisor',
    topePorcentajeDescuento: 20,
  })
  store.usuarios.set('usr-admin', {
    id: 'usr-admin',
    rol: 'administrador',
    topePorcentajeDescuento: 100,
  })
}
