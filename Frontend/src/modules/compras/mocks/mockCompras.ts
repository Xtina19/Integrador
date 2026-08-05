/**
 * Semilla local de órdenes y recepciones.
 * Se usa mientras la BD no tenga registros o falle la carga API.
 * Las facturas de proveedor NO van aquí — solo vienen de /api/compras/facturas.
 */
export const purchaseOrders = [
  {
    id: 'OC-2026-089',
    supplier: 'Distribuidora Continental',
    date: '2026-06-18',
    items: 45,
    total: 125400,
    status: 'approved' as const,
    lines: [{ product: '1984', qty: 45, unitCost: 2786.67 }],
  },
  {
    id: 'OC-2026-088',
    supplier: 'Importadora del Caribe',
    date: '2026-06-15',
    items: 120,
    total: 342000,
    status: 'pending' as const,
    lines: [{ product: 'Cien años de soledad', qty: 120, unitCost: 2850 }],
  },
  {
    id: 'OC-2026-087',
    supplier: 'Editorial Planeta RD',
    date: '2026-06-12',
    items: 28,
    total: 45600,
    status: 'received' as const,
    lines: [{ product: 'El Principito', qty: 28, unitCost: 1628.57 }],
  },
  {
    id: 'OC-2026-086',
    supplier: 'Papelería Mayorista',
    date: '2026-06-10',
    items: 15,
    total: 8900,
    status: 'draft' as const,
    lines: [{ product: 'Cuaderno rayado 80 hojas', qty: 15, unitCost: 593.33 }],
  },
  {
    id: 'OC-2026-085',
    supplier: 'Logística Express',
    date: '2026-06-08',
    items: 8,
    total: 3200,
    status: 'cancelled' as const,
    lines: [{ product: 'Marcadores permanentes (12u)', qty: 8, unitCost: 400 }],
  },
  {
    id: 'OC-2026-084',
    supplier: 'Distribuidora Continental',
    date: '2026-06-05',
    items: 67,
    total: 198500,
    status: 'received' as const,
    lines: [{ product: 'Don Quijote de la Mancha', qty: 67, unitCost: 2962.69 }],
  },
]

export const receptions = [
  {
    id: 'REC-2026-034',
    orderId: 'OC-2026-087',
    supplier: 'Editorial Planeta RD',
    date: '2026-06-17',
    items: 28,
    status: 'complete' as const,
  },
  {
    id: 'REC-2026-033',
    orderId: 'OC-2026-084',
    supplier: 'Distribuidora Continental',
    date: '2026-06-14',
    items: 65,
    status: 'complete' as const,
  },
  {
    id: 'REC-2026-032',
    orderId: 'OC-2026-088',
    supplier: 'Importadora del Caribe',
    date: '2026-06-20',
    items: 0,
    status: 'pending' as const,
  },
]
