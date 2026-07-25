export const purchaseStats = {
  monthlyPurchases: 485200,
  openOrders: 8,
  pendingReceptions: 3,
  activeSuppliers: 5,
}

export const purchaseOrders = [
  { id: 'OC-2026-089', supplier: 'Distribuidora Continental', date: '2026-06-18', items: 45, total: 125400, status: 'approved' as const },
  { id: 'OC-2026-088', supplier: 'Importadora del Caribe', date: '2026-06-15', items: 120, total: 342000, status: 'pending' as const },
  { id: 'OC-2026-087', supplier: 'Editorial Planeta RD', date: '2026-06-12', items: 28, total: 45600, status: 'received' as const },
  { id: 'OC-2026-086', supplier: 'Papelería Mayorista', date: '2026-06-10', items: 15, total: 8900, status: 'draft' as const },
  { id: 'OC-2026-085', supplier: 'Logística Express', date: '2026-06-08', items: 8, total: 3200, status: 'cancelled' as const },
  { id: 'OC-2026-084', supplier: 'Distribuidora Continental', date: '2026-06-05', items: 67, total: 198500, status: 'received' as const },
]

export const receptions = [
  { id: 'REC-2026-034', orderId: 'OC-2026-087', supplier: 'Editorial Planeta RD', date: '2026-06-17', items: 28, status: 'complete' as const },
  { id: 'REC-2026-033', orderId: 'OC-2026-084', supplier: 'Distribuidora Continental', date: '2026-06-14', items: 65, status: 'complete' as const },
  { id: 'REC-2026-032', orderId: 'OC-2026-088', supplier: 'Importadora del Caribe', date: '2026-06-20', items: 0, status: 'pending' as const },
]

export const supplierInvoices = [
  { id: 'FP-2026-156', supplier: 'Distribuidora Continental', orderId: 'OC-2026-084', date: '2026-06-14', amount: 198500, status: 'paid' as const },
  { id: 'FP-2026-155', supplier: 'Editorial Planeta RD', orderId: 'OC-2026-087', date: '2026-06-17', amount: 45600, status: 'paid' as const },
  { id: 'FP-2026-154', supplier: 'Importadora del Caribe', orderId: 'OC-2026-088', date: '2026-06-19', amount: 342000, status: 'pending' as const },
]

/** Alineado con constants/stateMachines + modules/compras/constants/comprasUi */
export const purchaseStatusMap: Record<string, { label: string; variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger' }> = {
  draft: { label: 'Borrador', variant: 'neutral' },
  pending: { label: 'Pendiente', variant: 'warning' },
  approved: { label: 'Aprobada', variant: 'info' },
  received: { label: 'Recibida', variant: 'success' },
  finalized: { label: 'Finalizada', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'danger' },
}

export const monthlyPurchases = [
  { month: 'Ene', purchases: 420000 },
  { month: 'Feb', purchases: 445000 },
  { month: 'Mar', purchases: 468000 },
  { month: 'Abr', purchases: 452000 },
  { month: 'May', purchases: 471000 },
  { month: 'Jun', purchases: 485200 },
]
