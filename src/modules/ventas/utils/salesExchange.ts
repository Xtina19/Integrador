import type { ProductExchangeRecord, SaleLineItem } from '@/modules/ventas/types/salesExchange'

export function computeExchangeDifference(
  originalUnitPrice: number,
  newUnitPrice: number,
  qty: number
): number {
  if (qty <= 0) return 0
  return (newUnitPrice - originalUnitPrice) * qty
}

export function getMaxExchangeQty(
  item: SaleLineItem,
  invoiceId: string,
  productId: string,
  exchanges: ProductExchangeRecord[]
): number {
  const alreadyExchanged = exchanges
    .filter((e) => e.invoiceId === invoiceId && e.originalProductId === productId)
    .reduce((sum, e) => sum + e.qty, 0)
  return Math.max(0, item.qty - alreadyExchanged)
}

export function formatPriceDifference(diff: number): {
  type: 'none' | 'charge' | 'credit'
  label: string
  amount: number
} {
  if (diff === 0) {
    return { type: 'none', label: 'Cambio realizado sin diferencia.', amount: 0 }
  }
  if (diff > 0) {
    return {
      type: 'charge',
      label: 'Monto adicional a cobrar.',
      amount: diff,
    }
  }
  return {
    type: 'credit',
    label: 'Saldo a favor.',
    amount: Math.abs(diff),
  }
}
