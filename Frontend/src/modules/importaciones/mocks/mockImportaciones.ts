import type { ShipmentCosts } from '@/types/domain'

export const importStats = {
  activeShipments: 4,
  boxesInTransit: 186,
  avgCost: 12.45,
  yearlyImports: 28,
}

export const shipments = [
  { id: 'EMB-2026-012', code: 'EMB-012', type: 'Marítimo' as const, departure: '2026-05-28', arrival: '2026-06-25', status: 'in_transit' as const, boxes: 84, origin: 'Barcelona, ES', destination: 'Santo Domingo, RD', notes: 'Contenedor refrigerado — prioridad alta' },
  { id: 'EMB-2026-011', code: 'EMB-011', type: 'Aéreo' as const, departure: '2026-06-10', arrival: '2026-06-12', status: 'received' as const, boxes: 12, origin: 'Madrid, ES', destination: 'Santo Domingo, RD', notes: 'Envío urgente de novedades editoriales' },
  { id: 'EMB-2026-010', code: 'EMB-010', type: 'Courier' as const, departure: '2026-06-15', arrival: '2026-06-18', status: 'received' as const, boxes: 3, origin: 'México DF, MX', destination: 'Santo Domingo, RD', notes: 'Muestras y reposición menor' },
  { id: 'EMB-2026-009', code: 'EMB-009', type: 'Marítimo' as const, departure: '2026-06-01', arrival: '2026-06-28', status: 'in_transit' as const, boxes: 102, origin: 'Valencia, ES', destination: 'Santo Domingo, RD', notes: 'Consolidado con embarque EMB-012' },
]

export const internationalInvoices = [
  { id: 'FI-2026-045', orderId: 'OC-INT-2026-091', shipment: 'EMB-012', supplier: 'Planeta Internacional', date: '2026-05-25', currency: 'EUR', amount: 45200, status: 'pending' as const, stage: 'freight' as const },
  { id: 'FI-2026-044', orderId: 'OC-INT-2026-090', shipment: 'EMB-011', supplier: 'Alfaguara Export', date: '2026-06-08', currency: 'EUR', amount: 12800, status: 'paid' as const, stage: 'costing' as const },
  { id: 'FI-2026-043', orderId: 'OC-INT-2026-089', shipment: 'EMB-009', supplier: 'Penguin Random House', date: '2026-05-28', currency: 'USD', amount: 68500, status: 'pending' as const, stage: 'consolidation' as const },
]

/** Una consolidación por embarque — recepción en almacén destino (scriptdb: Consolidacion.id_embarque). */
export const consolidations = [
  {
    id: 'CON-2026-012',
    code: 'CONS-012',
    shipmentCode: 'EMB-012',
    warehouseName: 'Almacén Central',
    date: '2026-06-25',
    totalBultos: 84,
    weightKg: 680,
    volumeM3: 2.4,
    status: 'pending' as const,
    notes: 'Recepción programada — embarque marítimo desde Barcelona',
  },
  {
    id: 'CON-2026-009',
    code: 'CONS-009',
    shipmentCode: 'EMB-009',
    warehouseName: 'Almacén Central',
    date: '2026-06-28',
    totalBultos: 102,
    weightKg: 720,
    volumeM3: 3.1,
    status: 'pending' as const,
    notes: 'En tránsito marítimo desde Valencia',
  },
  {
    id: 'CON-2026-011',
    code: 'CONS-011',
    shipmentCode: 'EMB-011',
    warehouseName: 'Almacén Central',
    date: '2026-06-12',
    totalBultos: 12,
    weightKg: 180,
    volumeM3: 0.8,
    status: 'closed' as const,
    notes: 'Embarque aéreo recibido y cerrado en almacén central',
  },
]

export const shipmentCostsByCode: Record<string, ShipmentCosts> = {
  'EMB-012': {
    internationalFreight: 12400,
    insurance: 2100,
    customs: 8900,
    localTransport: 800,
    portFees: 450,
    handling: 250,
    other: 0,
  },
  'EMB-011': {
    internationalFreight: 3200,
    insurance: 450,
    customs: 1800,
    localTransport: 120,
    portFees: 50,
    handling: 30,
    other: 0,
  },
}

/** @deprecated Costos ahora viven en cada embarque (Shipment.costs) */
export const freightCosts = [
  { id: 'CF-001', shipment: 'EMB-012', freight: 12400, insurance: 2100, customs: 8900, other: 1500, total: 24900 },
  { id: 'CF-002', shipment: 'EMB-011', freight: 3200, insurance: 450, customs: 1800, other: 200, total: 5650 },
]

export const bookCosting = [
  { isbn: '978-0307474728', title: 'Cien años de soledad', productCost: 8.50, freightAlloc: 1.20, finalCost: 9.70, salePrice: 14.55, marginPercent: 50 },
  { isbn: '978-8497592432', title: 'La sombra del viento', productCost: 6.80, freightAlloc: 0.95, finalCost: 7.75, salePrice: 11.63, marginPercent: 50 },
  { isbn: '978-8498384453', title: 'Harry Potter y la piedra filosofal', productCost: 9.20, freightAlloc: 1.35, finalCost: 10.55, salePrice: 15.83, marginPercent: 50 },
  { isbn: '978-0451524935', title: '1984', productCost: 4.50, freightAlloc: 0.65, finalCost: 5.15, salePrice: 7.73, marginPercent: 50 },
]

export const shipmentStatusMap: Record<string, { label: string; variant: 'info' | 'warning' | 'success' }> = {
  in_transit: { label: 'En tránsito', variant: 'warning' },
  received: { label: 'Recibido', variant: 'success' },
  customs: { label: 'En aduana', variant: 'info' },
}
