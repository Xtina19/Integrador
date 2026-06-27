import type { ShipmentCosts } from '../types/domain'

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

export function computeShipmentCostsTotal(costs: ShipmentCosts): number {
  return shipmentCostFields.reduce((sum, { key }) => sum + (costs[key] || 0), 0)
}

export function hasShipmentCosts(costs?: ShipmentCosts): boolean {
  if (!costs) return false
  return computeShipmentCostsTotal(costs) > 0
}
