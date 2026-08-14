import type { BookCostingEntry, PurchaseOrderLine } from '@/types/domain'

/** Margen de ganancia por defecto sobre costo total (producto + flete asignado). */
export const BOOK_COSTING_MARGIN_PERCENT = 50

export function clampBookCostingMargin(percent: number): number {
  if (!Number.isFinite(percent)) return BOOK_COSTING_MARGIN_PERCENT
  return Math.min(999, Math.max(0, Number(percent.toFixed(2))))
}

export function bookCostingMarginFactor(marginPercent = BOOK_COSTING_MARGIN_PERCENT): number {
  return 1 + clampBookCostingMargin(marginPercent) / 100
}

export function computeBookCostingSalePrice(
  landedCostPerUnit: number,
  marginPercent = BOOK_COSTING_MARGIN_PERCENT,
): number {
  return Number((landedCostPerUnit * bookCostingMarginFactor(marginPercent)).toFixed(2))
}

export function withBookCostingMargin(
  entry: BookCostingEntry,
  marginPercent: number,
): BookCostingEntry {
  const next = clampBookCostingMargin(marginPercent)
  return {
    ...entry,
    marginPercent: next,
    salePrice: computeBookCostingSalePrice(entry.finalCost, next),
  }
}

export function bookCostingRowKey(entry: {
  shipmentId?: string
  productId?: string
  isbn?: string
  title: string
}): string {
  return [entry.shipmentId ?? '', entry.productId ?? '', entry.isbn ?? '', entry.title].join('|')
}

/** Reparte flete por línea; si no hay costo de producto, reparte por cantidad. */
export function allocateFreightPerUnit(
  lines: Pick<PurchaseOrderLine, 'qty' | 'unitCost'>[],
  freightTotal: number,
): number[] {
  const totalQty = lines.reduce((s, l) => s + l.qty, 0)
  const subtotal = lines.reduce((s, l) => s + l.qty * (l.unitCost ?? 0), 0)

  return lines.map((line) => {
    const share =
      subtotal > 0
        ? (line.qty * (line.unitCost ?? 0)) / subtotal
        : totalQty > 0
          ? line.qty / totalQty
          : 0
    return Number(((freightTotal * share) / Math.max(line.qty, 1)).toFixed(2))
  })
}
