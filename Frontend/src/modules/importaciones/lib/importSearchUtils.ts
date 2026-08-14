import type { Shipment, InternationalInvoice, Consolidation } from '@/types/domain'
import type { ERPState } from '@/store/initialState'

function includes(query: string, value?: string) {
  if (!value) return false
  return value.toLowerCase().includes(query.toLowerCase())
}

export function filterShipments(shipments: Shipment[], consolidations: Consolidation[], query: string) {
  if (!query.trim()) return shipments
  const q = query.trim().toLowerCase()
  return shipments.filter((s) => {
    const con = getConsolidationForShipment(s, consolidations)
    return (
      includes(q, s.code) ||
      includes(q, s.invoiceId) ||
      includes(q, s.orderId) ||
      includes(q, s.origin) ||
      includes(q, s.destination) ||
      includes(q, s.supplier) ||
      includes(q, s.consolidationId) ||
      includes(q, con?.code) ||
      includes(q, con?.warehouseName) ||
      includes(q, extractCountry(s.origin))
    )
  })
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
    const shipment = shipments.find((s) => s.id === c.shipmentId)
    return (
      includes(q, c.id) ||
      includes(q, c.code) ||
      includes(q, c.shipmentId) ||
      includes(q, shipment?.code) ||
      includes(q, shipment?.orderId) ||
      includes(q, shipment?.invoiceId) ||
      includes(q, c.warehouseName) ||
      includes(q, c.notes)
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

export function getShipmentForConsolidation(consolidation: Consolidation, shipments: Shipment[]) {
  return shipments.find((s) => s.id === consolidation.shipmentId) ?? null
}

export function getConsolidationForShipment(shipment: Shipment, consolidations: Consolidation[]) {
  if (!shipment.consolidationId) {
    return consolidations.find((c) => c.shipmentId === shipment.id) ?? null
  }
  return consolidations.find((c) => c.id === shipment.consolidationId) ?? null
}
