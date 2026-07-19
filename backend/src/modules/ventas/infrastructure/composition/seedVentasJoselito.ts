import type { InMemoryVentasStore } from '../persistence/InMemoryVentasStore'
import type { VentaRecord } from '../persistence/models/VentaPersistenceModels'

/**
 * Seed Joselito — clientes y productos alineados al catálogo Compras (mismos títulos/precios).
 * Incluye ventas realistas (contado, mixto, anulada, distintas sucursales/monedas).
 */
export function seedVentasJoselito(store: InMemoryVentasStore): void {
  const clientes: Array<{ id: string; nombre: string; activo?: boolean }> = [
    { id: 'CLI-000001', nombre: 'Colegio La Salle' },
    { id: 'CLI-000002', nombre: 'Instituto Iberia' },
    { id: 'CLI-000003', nombre: 'PUCMM' },
    { id: 'CLI-000004', nombre: 'UTESA' },
    { id: 'CLI-000005', nombre: 'Colegio Sagrado Corazón' },
    { id: 'CLI-000006', nombre: 'Librería Universitaria' },
    { id: 'CLI-000007', nombre: 'Fundación Madre y Maestra' },
    { id: 'CLI-000008', nombre: 'Cliente de Mostrador' },
  ]
  for (const c of clientes) {
    store.clientes.set(c.id, { id: c.id, nombre: c.nombre, activo: c.activo !== false })
  }

  const productos = [
    { id: 'prod-cien', titulo: 'Cien años de soledad', precio: 895.0, moneda: 'DOP' },
    { id: 'prod-sombra', titulo: 'La sombra del viento', precio: 780.0, moneda: 'DOP' },
    { id: 'prod-quijote', titulo: 'Don Quijote de la Mancha', precio: 950.0, moneda: 'DOP' },
    { id: 'prod-principito', titulo: 'El Principito', precio: 550.0, moneda: 'DOP' },
    { id: 'prod-habitos', titulo: 'Hábitos Atómicos', precio: 1150.0, moneda: 'DOP' },
    { id: 'prod-padre', titulo: 'Padre Rico Padre Pobre', precio: 990.0, moneda: 'DOP' },
    { id: 'prod-cleancode', titulo: 'Clean Code', precio: 1850.0, moneda: 'DOP' },
    { id: 'prod-hp', titulo: 'Harry Potter y la piedra filosofal', precio: 850.0, moneda: 'DOP' },
    { id: 'prod-onepiece', titulo: 'One Piece Vol. 1', precio: 425.0, moneda: 'DOP' },
    { id: 'prod-naruto', titulo: 'Naruto Vol. 1', precio: 425.0, moneda: 'DOP' },
    { id: 'prod-jujutsu', titulo: 'Jujutsu Kaisen Vol. 1', precio: 450.0, moneda: 'DOP' },
    { id: 'prod-1984', titulo: '1984', precio: 595.0, moneda: 'DOP' },
    { id: 'prod-spiderman', titulo: 'Amazing Spider-Man Vol. 1', precio: 720.0, moneda: 'DOP' },
    { id: 'prod-batman', titulo: 'Batman: Año Uno', precio: 760.0, moneda: 'DOP' },
    { id: 'prod-matilda', titulo: 'Matilda', precio: 650.0, moneda: 'DOP' },
    { id: 'prod-booklight', titulo: 'Book light LED clip', precio: 450.0, moneda: 'DOP' },
  ] as const

  for (const p of productos) {
    store.productos.set(p.id, { ...p, activo: true })
  }

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

  seedVentasDocumentos(store)
}

function putVenta(store: InMemoryVentasStore, v: VentaRecord): void {
  store.ventas.set(v.id, v)
  store.ventasByNumero.set(v.numeroFactura, v.id)
}

function seedVentasDocumentos(store: InMemoryVentasStore): void {
  const today = new Date().toISOString().slice(0, 10)

  // 1) Mostrador — contado efectivo — hoy
  putVenta(store, {
    id: 'venta-seed-001',
    numeroFactura: 'F-SUC-CTR-1001',
    estado: 'emitida',
    tipoVenta: 'consumidor_final',
    sucursalId: 'suc-central',
    almacenId: 'alm-central',
    usuarioEmisionId: 'usr-cajero',
    moneda: 'DOP',
    fechaEmision: `${today}T09:15:00.000Z`,
    subtotal: 1490.0,
    totalDescuentos: 0,
    total: 1490.0,
    version: 1,
    tieneCambios: false,
    tieneDevoluciones: false,
    tieneNotasCredito: false,
    lineas: [
      {
        id: 'vl-001-1',
        productoId: 'prod-cien',
        descripcionSnapshot: 'Cien años de soledad',
        cantidad: 1,
        precioUnitario: 895.0,
        moneda: 'DOP',
        importeNeto: 895.0,
      },
      {
        id: 'vl-001-2',
        productoId: 'prod-1984',
        descripcionSnapshot: '1984',
        cantidad: 1,
        precioUnitario: 595.0,
        moneda: 'DOP',
        importeNeto: 595.0,
      },
    ],
    pagos: [
      { id: 'pg-001-1', formaPago: 'efectivo', monto: 1500.0, moneda: 'DOP', vuelto: 10.0 },
    ],
    cambios: [],
    devoluciones: [],
    notasCredito: [],
    historial: [
      {
        id: 'hv-001-1',
        tipoEvento: 'emision',
        usuarioId: 'usr-cajero',
        fecha: `${today}T09:15:00.000Z`,
        resultado: 'OK',
        detalle: 'Venta mostrador — efectivo',
      },
    ],
  })

  // 2) PUCMM — mixto transferencia+tarjeta — hoy
  putVenta(store, {
    id: 'venta-seed-002',
    numeroFactura: 'F-SUC-CTR-1002',
    estado: 'emitida',
    tipoVenta: 'cliente_registrado',
    clienteId: 'CLI-000003',
    sucursalId: 'suc-central',
    almacenId: 'alm-central',
    usuarioEmisionId: 'usr-cajero',
    moneda: 'DOP',
    fechaEmision: `${today}T11:40:00.000Z`,
    subtotal: 3785.0,
    totalDescuentos: 378.5,
    total: 3406.5,
    version: 1,
    tieneCambios: false,
    tieneDevoluciones: false,
    tieneNotasCredito: false,
    lineas: [
      {
        id: 'vl-002-1',
        productoId: 'prod-cien',
        descripcionSnapshot: 'Cien años de soledad',
        cantidad: 3,
        precioUnitario: 895.0,
        moneda: 'DOP',
        descuento: { tipo: 'porcentaje', valor: 10 },
        importeNeto: 2416.5,
      },
      {
        id: 'vl-002-2',
        productoId: 'prod-principito',
        descripcionSnapshot: 'El Principito',
        cantidad: 2,
        precioUnitario: 550.0,
        moneda: 'DOP',
        descuento: { tipo: 'porcentaje', valor: 10 },
        importeNeto: 990.0,
      },
    ],
    pagos: [
      { id: 'pg-002-1', formaPago: 'transferencia', monto: 2000.0, moneda: 'DOP' },
      { id: 'pg-002-2', formaPago: 'tarjeta', monto: 1406.5, moneda: 'DOP' },
    ],
    cambios: [],
    devoluciones: [],
    notasCredito: [],
    historial: [
      {
        id: 'hv-002-1',
        tipoEvento: 'emision',
        usuarioId: 'usr-cajero',
        fecha: `${today}T11:40:00.000Z`,
        resultado: 'OK',
        detalle: 'PUCMM — pago mixto',
      },
    ],
  })

  // 3) La Salle — transferencia — mes (crédito institucional cobrado)
  putVenta(store, {
    id: 'venta-seed-003',
    numeroFactura: 'F-SUC-CTR-1003',
    estado: 'emitida',
    tipoVenta: 'cliente_registrado',
    clienteId: 'CLI-000001',
    sucursalId: 'suc-central',
    almacenId: 'alm-central',
    usuarioEmisionId: 'usr-supervisor',
    moneda: 'DOP',
    fechaEmision: '2026-07-05T14:20:00.000Z',
    subtotal: 4250.0,
    totalDescuentos: 0,
    total: 4250.0,
    version: 1,
    tieneCambios: false,
    tieneDevoluciones: false,
    tieneNotasCredito: false,
    lineas: [
      {
        id: 'vl-003-1',
        productoId: 'prod-hp',
        descripcionSnapshot: 'Harry Potter y la piedra filosofal',
        cantidad: 5,
        precioUnitario: 850.0,
        moneda: 'DOP',
        importeNeto: 4250.0,
      },
    ],
    pagos: [{ id: 'pg-003-1', formaPago: 'transferencia', monto: 4250.0, moneda: 'DOP' }],
    cambios: [],
    devoluciones: [],
    notasCredito: [],
    historial: [
      {
        id: 'hv-003-1',
        tipoEvento: 'emision',
        usuarioId: 'usr-supervisor',
        fecha: '2026-07-05T14:20:00.000Z',
        resultado: 'OK',
        detalle: 'Colegio La Salle — transferencia',
      },
    ],
  })

  // 4) Manga mostrador — tarjeta — Santiago
  putVenta(store, {
    id: 'venta-seed-004',
    numeroFactura: 'F-SUCS-1001',
    estado: 'emitida',
    tipoVenta: 'consumidor_final',
    sucursalId: 'suc-santiago',
    almacenId: 'alm-santiago',
    usuarioEmisionId: 'usr-cajero',
    moneda: 'DOP',
    fechaEmision: `${today}T16:05:00.000Z`,
    subtotal: 1300.0,
    totalDescuentos: 0,
    total: 1300.0,
    version: 1,
    tieneCambios: false,
    tieneDevoluciones: false,
    tieneNotasCredito: false,
    lineas: [
      {
        id: 'vl-004-1',
        productoId: 'prod-onepiece',
        descripcionSnapshot: 'One Piece Vol. 1',
        cantidad: 2,
        precioUnitario: 425.0,
        moneda: 'DOP',
        importeNeto: 850.0,
      },
      {
        id: 'vl-004-2',
        productoId: 'prod-naruto',
        descripcionSnapshot: 'Naruto Vol. 1',
        cantidad: 1,
        precioUnitario: 425.0,
        moneda: 'DOP',
        importeNeto: 425.0,
      },
    ],
    pagos: [{ id: 'pg-004-1', formaPago: 'tarjeta', monto: 1300.0, moneda: 'DOP' }],
    cambios: [],
    devoluciones: [],
    notasCredito: [],
    historial: [
      {
        id: 'hv-004-1',
        tipoEvento: 'emision',
        usuarioId: 'usr-cajero',
        fecha: `${today}T16:05:00.000Z`,
        resultado: 'OK',
        detalle: 'Santiago — tarjeta',
      },
    ],
  })

  // 5) Anulada — error de cobro
  putVenta(store, {
    id: 'venta-seed-005',
    numeroFactura: 'F-SUC-CTR-1004',
    estado: 'anulada',
    tipoVenta: 'consumidor_final',
    sucursalId: 'suc-central',
    almacenId: 'alm-central',
    usuarioEmisionId: 'usr-cajero',
    moneda: 'DOP',
    fechaEmision: '2026-07-12T12:00:00.000Z',
    subtotal: 1850.0,
    totalDescuentos: 0,
    total: 1850.0,
    version: 2,
    tieneCambios: false,
    tieneDevoluciones: false,
    tieneNotasCredito: false,
    motivoAnulacion: 'Cobro duplicado — anulación supervisada',
    lineas: [
      {
        id: 'vl-005-1',
        productoId: 'prod-cleancode',
        descripcionSnapshot: 'Clean Code',
        cantidad: 1,
        precioUnitario: 1850.0,
        moneda: 'DOP',
        importeNeto: 1850.0,
      },
    ],
    pagos: [{ id: 'pg-005-1', formaPago: 'tarjeta', monto: 1850.0, moneda: 'DOP' }],
    cambios: [],
    devoluciones: [],
    notasCredito: [],
    historial: [
      {
        id: 'hv-005-1',
        tipoEvento: 'emision',
        usuarioId: 'usr-cajero',
        fecha: '2026-07-12T12:00:00.000Z',
        resultado: 'OK',
      },
      {
        id: 'hv-005-2',
        tipoEvento: 'anulacion',
        usuarioId: 'usr-supervisor',
        fecha: '2026-07-12T12:30:00.000Z',
        resultado: 'OK',
        detalle: 'Cobro duplicado — anulación supervisada',
      },
    ],
  })

  // 6) Fundación — autoayuda — efectivo
  putVenta(store, {
    id: 'venta-seed-006',
    numeroFactura: 'F-SUC-CTR-1005',
    estado: 'emitida',
    tipoVenta: 'cliente_registrado',
    clienteId: 'CLI-000007',
    sucursalId: 'suc-central',
    almacenId: 'alm-central',
    usuarioEmisionId: 'usr-cajero',
    moneda: 'DOP',
    fechaEmision: '2026-07-08T10:00:00.000Z',
    subtotal: 2140.0,
    totalDescuentos: 0,
    total: 2140.0,
    version: 1,
    tieneCambios: false,
    tieneDevoluciones: false,
    tieneNotasCredito: false,
    lineas: [
      {
        id: 'vl-006-1',
        productoId: 'prod-habitos',
        descripcionSnapshot: 'Hábitos Atómicos',
        cantidad: 1,
        precioUnitario: 1150.0,
        moneda: 'DOP',
        importeNeto: 1150.0,
      },
      {
        id: 'vl-006-2',
        productoId: 'prod-padre',
        descripcionSnapshot: 'Padre Rico Padre Pobre',
        cantidad: 1,
        precioUnitario: 990.0,
        moneda: 'DOP',
        importeNeto: 990.0,
      },
    ],
    pagos: [{ id: 'pg-006-1', formaPago: 'efectivo', monto: 2140.0, moneda: 'DOP', vuelto: 0 }],
    cambios: [],
    devoluciones: [],
    notasCredito: [],
    historial: [
      {
        id: 'hv-006-1',
        tipoEvento: 'emision',
        usuarioId: 'usr-cajero',
        fecha: '2026-07-08T10:00:00.000Z',
        resultado: 'OK',
        detalle: 'Fundación Madre y Maestra',
      },
    ],
  })

  // 7) Iberia — USD (pedido especial importación mostrador)
  putVenta(store, {
    id: 'venta-seed-007',
    numeroFactura: 'F-SUC-CTR-1006',
    estado: 'emitida',
    tipoVenta: 'cliente_registrado',
    clienteId: 'CLI-000002',
    sucursalId: 'suc-central',
    almacenId: 'alm-central',
    usuarioEmisionId: 'usr-supervisor',
    moneda: 'USD',
    fechaEmision: '2026-07-15T15:30:00.000Z',
    subtotal: 95.0,
    totalDescuentos: 0,
    total: 95.0,
    version: 1,
    tieneCambios: false,
    tieneDevoluciones: false,
    tieneNotasCredito: false,
    lineas: [
      {
        id: 'vl-007-1',
        productoId: 'prod-cleancode',
        descripcionSnapshot: 'Clean Code',
        cantidad: 2,
        precioUnitario: 47.5,
        moneda: 'USD',
        importeNeto: 95.0,
      },
    ],
    pagos: [{ id: 'pg-007-1', formaPago: 'transferencia', monto: 95.0, moneda: 'USD' }],
    cambios: [],
    devoluciones: [],
    notasCredito: [],
    historial: [
      {
        id: 'hv-007-1',
        tipoEvento: 'emision',
        usuarioId: 'usr-supervisor',
        fecha: '2026-07-15T15:30:00.000Z',
        resultado: 'OK',
        detalle: 'Instituto Iberia — USD',
      },
    ],
  })
}
