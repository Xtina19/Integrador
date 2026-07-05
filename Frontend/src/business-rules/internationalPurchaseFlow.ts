import type { ImportPipelineStage } from '../types/domain'

export const importPipelineLabels: Record<ImportPipelineStage, string> = {
  invoice: 'Factura Internacional',
  shipment: 'Embarque registrado',
  consolidation: 'Consolidación',
  freight: 'Costos de flete',
  costing: 'Costeo por libro',
  reception: 'Recepción de mercancía',
  completed: 'Completado',
}

export const importPipelineOrder: ImportPipelineStage[] = [
  'invoice',
  'shipment',
  'consolidation',
  'freight',
  'costing',
  'reception',
  'completed',
]

export function nextImportStage(current: ImportPipelineStage): ImportPipelineStage | null {
  const idx = importPipelineOrder.indexOf(current)
  return importPipelineOrder[idx + 1] ?? null
}

export function isInternationalSupplier(supplierName: string, internationalNames: string[]): boolean {
  return internationalNames.some((n) => n.toLowerCase() === supplierName.toLowerCase())
}
