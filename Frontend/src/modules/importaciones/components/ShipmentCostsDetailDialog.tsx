import { X } from 'lucide-react'
import type { FreightCostDocument, ShipmentCosts } from '@/types/domain'
import { shipmentCostFields, computeShipmentCostsTotal } from '@/business-rules/shipmentCosts'
import { formatDop, formatMoney } from '@/lib/money'

interface ShipmentCostsDetailDialogProps {
  open: boolean
  onClose: () => void
  shipmentCode: string
  invoiceId?: string
  costs: ShipmentCosts
  documents?: FreightCostDocument[]
}

export function ShipmentCostsDetailDialog({
  open,
  onClose,
  shipmentCode,
  invoiceId,
  costs,
  documents = [],
}: ShipmentCostsDetailDialogProps) {
  if (!open) return null

  const total = computeShipmentCostsTotal(costs)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Costos del Embarque</h3>
            <p className="text-sm text-gray-500 font-mono">
              {shipmentCode}
              {invoiceId ? ` — ${invoiceId}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {documents.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Documentos registrados</h4>
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li key={d.id} className="text-sm border border-gray-100 rounded-lg px-3 py-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-mono text-corporate">{d.code}</span>
                      <span className="font-medium tabular-nums">{formatMoney(d.amount, d.currency)}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1">
                      {d.documentType} · {d.concept} · {d.serviceProvider}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Resumen por concepto</h4>
            <div className="space-y-3">
              {shipmentCostFields.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium tabular-nums">{formatDop(costs[key])}</span>
                </div>
              ))}
              <div className="pt-3 mt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-corporate tabular-nums">{formatDop(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
