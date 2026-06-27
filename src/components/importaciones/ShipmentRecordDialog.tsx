import { useEffect, useState } from 'react'
import type { Shipment, ShipmentCosts } from '../../types/domain'
import { FormDialog, DetailRow } from '../ui/FormDialog'
import { Input, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { importStatusLabels } from '../../business-rules/stateMachines'
import {
  shipmentCostFields,
  emptyShipmentCosts,
  computeShipmentCostsTotal,
  hasShipmentCosts,
} from '../../business-rules/shipmentCosts'
import { extractCountry } from '../../lib/importSearchUtils'
import { useERP } from '../../store/ERPProvider'

interface ShipmentRecordDialogProps {
  shipment: Shipment | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const importStatusVariants: Record<Shipment['status'], 'info' | 'warning' | 'success'> = {
  registered: 'info',
  in_transit: 'warning',
  customs: 'info',
  received: 'success',
  costed: 'success',
  finalized: 'success',
}

function formatCurrency(value: number) {
  return `RD$${value.toLocaleString()}`
}

export function ShipmentRecordDialog({ shipment, mode, open, onClose, onEdit }: ShipmentRecordDialogProps) {
  const { updateShipment } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '',
    type: 'Marítimo' as Shipment['type'],
    origin: '',
    destination: '',
    departure: '',
    arrival: '',
    boxes: '',
    notes: '',
  })
  const [costs, setCosts] = useState<ShipmentCosts>(emptyShipmentCosts())

  useEffect(() => {
    if (!shipment) return
    setForm({
      code: shipment.code,
      type: shipment.type,
      origin: shipment.origin,
      destination: shipment.destination,
      departure: shipment.departure,
      arrival: shipment.arrival,
      boxes: String(shipment.boxes),
      notes: shipment.notes ?? '',
    })
    setCosts(shipment.costs ?? emptyShipmentCosts())
    setError('')
  }, [shipment, mode, open])

  if (!shipment) return null

  function handleSave() {
    const result = updateShipment({
      shipmentId: shipment!.id,
      code: form.code,
      type: form.type,
      origin: form.origin,
      destination: form.destination,
      departure: form.departure,
      arrival: form.arrival,
      boxes: Number(form.boxes) || 0,
      notes: form.notes,
      costs,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al guardar')
      return
    }
    onClose()
  }

  function updateCost(key: keyof ShipmentCosts, value: string) {
    setCosts((prev) => ({ ...prev, [key]: Number(value) || 0 }))
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'view' ? 'Detalle del Embarque' : 'Editar Embarque'}
      subtitle={shipment.code}
      mode={mode}
      onEdit={onEdit}
      onSave={handleSave}
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {mode === 'view' ? (
        <div className="space-y-1">
          <DetailRow label="Código" value={<span className="font-mono">{shipment.code}</span>} />
          <DetailRow label="Tipo de transporte" value={shipment.type} />
          <DetailRow label="Orden de compra" value={<span className="font-mono">{shipment.orderId ?? '—'}</span>} />
          <DetailRow label="Factura internacional" value={<span className="font-mono">{shipment.invoiceId ?? '—'}</span>} />
          <DetailRow label="País de origen" value={extractCountry(shipment.origin)} />
          <DetailRow label="Origen" value={shipment.origin} />
          <DetailRow label="Destino" value={shipment.destination} />
          <DetailRow label="Fecha salida" value={shipment.departure} />
          <DetailRow label="Fecha llegada" value={shipment.arrival} />
          <DetailRow
            label="Estado"
            value={
              <Badge variant={importStatusVariants[shipment.status]}>
                {importStatusLabels[shipment.status]}
              </Badge>
            }
          />
          <DetailRow label="Cantidad de cajas" value={shipment.boxes} />
          <DetailRow label="Observaciones" value={shipment.notes?.trim() ? shipment.notes : '—'} />
          {hasShipmentCosts(shipment.costs) && (
            <div className="pt-4 mt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-900 mb-3">Costos asociados</p>
              {shipmentCostFields.map(({ key, label }) => (
                <DetailRow key={key} label={label} value={formatCurrency(shipment.costs![key])} />
              ))}
              <DetailRow
                label="Total costos"
                value={<span className="font-bold text-corporate">{formatCurrency(computeShipmentCostsTotal(shipment.costs!))}</span>}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Código embarque *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Select
              label="Tipo *"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as Shipment['type'] })}
              options={[
                { value: 'Marítimo', label: 'Marítimo' },
                { value: 'Aéreo', label: 'Aéreo' },
                { value: 'Courier', label: 'Courier' },
              ]}
            />
            <Input label="Origen *" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
            <Input label="Destino *" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            <Input label="Fecha salida *" type="date" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} />
            <Input label="Fecha llegada *" type="date" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} />
            <Input label="Cantidad de cajas *" type="number" min={1} value={form.boxes} onChange={(e) => setForm({ ...form, boxes: e.target.value })} />
            <Input label="Orden de compra" value={shipment.orderId ?? ''} disabled />
            <Input label="Factura internacional" value={shipment.invoiceId ?? ''} disabled className="md:col-span-2" />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate"
                placeholder="Notas del embarque..."
              />
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Costos del Embarque</h3>
              <p className="text-sm text-gray-500">
                Total: <span className="font-bold text-corporate">RD${computeShipmentCostsTotal(costs).toLocaleString()}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shipmentCostFields.map(({ key, label }) => (
                <Input
                  key={key}
                  label={label}
                  type="number"
                  min={0}
                  step="0.01"
                  value={costs[key] || ''}
                  onChange={(e) => updateCost(key, e.target.value)}
                  placeholder="0"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
