import type { ShipmentCosts } from '@/types/domain'

export const shipmentCostFields: { key: keyof ShipmentCosts; label: string }[] = [
  { key: 'internationalFreight', label: 'Flete internacional' },
  { key: 'insurance', label: 'Seguro' },
  { key: 'customs', label: 'Aduana' },
  { key: 'localTransport', label: 'Transporte local' },
  { key: 'portFees', label: 'Gastos portuarios' },
  { key: 'handling', label: 'Manipulación' },
  { key: 'other', label: 'Otros gastos' },
]

export function emptyShipmentCosts(): ShipmentCosts {
  return {
    internationalFreight: 0,
    insurance: 0,
    customs: 0,
    localTransport: 0,
    portFees: 0,
    handling: 0,
    other: 0,
  }
}

export function computeShipmentCostsTotal(costs?: ShipmentCosts | null): number {
  if (!costs) return 0
  return shipmentCostFields.reduce((sum, { key }) => sum + (costs[key] || 0), 0)
}

export function hasShipmentCosts(costs?: ShipmentCosts | null): boolean {
  return computeShipmentCostsTotal(costs) > 0
}

export const freightDocumentTypes = [
  'Factura flete',
  'Conocimiento de embarque',
  'Guía aérea',
  'Factura aduana',
  'Recibo portuario',
  'Otros',
] as const

export const freightConceptOptions = shipmentCostFields.map(({ key, label }) => ({
  key,
  label,
}))

export function conceptLabelToKey(label: string): keyof ShipmentCosts | 'other' {
  const found = shipmentCostFields.find((f) => f.label === label)
  return found?.key ?? 'other'
}
