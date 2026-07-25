/** Tipos para Cambios de Productos y Notas de Crédito (mock — preparado para MySQL) */

export interface SaleLineItem {
  productId: string
  code: string
  title: string
  qty: number
  unitPrice: number
}

export type CreditNoteStatus = 'active' | 'used' | 'expired'

export interface CreditNote {
  id: string
  invoiceId: string
  exchangeId: string
  date: string
  reason: string
  amount: number
  status: CreditNoteStatus
}

export interface ProductExchangeRecord {
  id: string
  invoiceId: string
  originalProductId: string
  originalProductTitle: string
  newProductId: string
  newProductTitle: string
  qty: number
  reason: string
  priceDifference: number
  creditNoteId?: string
  user: string
  date: string
}

export const EXCHANGE_REASONS = [
  'Producto defectuoso',
  'Cambio por preferencia',
  'Error en despacho',
  'Error de venta',
  'Otro',
] as const satisfies readonly string[]

export type ExchangeDialogTab = 'factura' | 'cambio' | 'resultado'

export type CambiosPageTab = 'cambios' | 'notas'

export const CREDIT_NOTE_STATUS_LABELS: Record<CreditNoteStatus, string> = {
  active: 'Activa',
  used: 'Utilizada',
  expired: 'Vencida',
}
