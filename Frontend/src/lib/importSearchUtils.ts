import type { Shipment, InternationalInvoice, Consolidation } from '../types/domain'
import type { ERPState } from '../store/initialState'

function includes(query: string, value?: string) {
  if (!value) return false
  return value.toLowerCase().includes(query.toLowerCase())
}

export function filterShipments(shipments: Shipment[], query: string) {
  if (!query.trim()) return shipments
  const q = query.trim().toLowerCase()
  return shipments.filter(
    (s) =>
      includes(q, s.code) ||
      includes(q, s.invoiceId) ||
      includes(q, s.orderId) ||
      includes(q, s.origin) ||
      includes(q, s.destination) ||
      includes(q, s.supplier) ||
      includes(q, extractCountry(s.origin))
  )
}

export function filterInternationalInvoices(invoices: InternationalInvoice[], query: string) {
  if (!query.trim()) return invoices
  const q = query.trim().toLowerCase()
  return invoices.filter(
    (f) =>
      includes(q, f.id) ||
      includes(q, f.supplier) ||
      includes(q, f.orderId) ||
      includes(q, f.shipmentCode) ||
      includes(q, f.shipmentId)
  )
}

export function filterConsolidations(
  consolidations: Consolidation[],
  shipments: Shipment[],
  query: string
) {
  if (!query.trim()) return consolidations
  const q = query.trim().toLowerCase()
  return consolidations.filter((c) => {
    const shipmentCodes = c.shipmentIds
      .map((id) => shipments.find((s) => s.id === id)?.code)
      .filter(Boolean) as string[]
    return (
      includes(q, c.id) ||
      includes(q, c.name) ||
      c.orderIds.some((id) => includes(q, id)) ||
      c.shipmentIds.some((id) => includes(q, id)) ||
      shipmentCodes.some((code) => includes(q, code))
    )
  })
}

export function extractCountry(origin: string) {
  const parts = origin.split(',').map((p) => p.trim())
  return parts.length > 1 ? parts[parts.length - 1] : origin
}

export function getInvoiceProducts(state: ERPState, orderId: string) {
  const order = state.purchaseOrders.find((o) => o.id === orderId)
  return order?.lines ?? []
}
