import { useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import type { Consolidation, Shipment } from '@/types/domain'
import { DetailRow } from '@/components/ui/FormDialog'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { validateConsolidationUpdate } from '@/business-rules/validators'
import { useERP } from '@/store/ERPProvider'
import { consolidationStatusMap } from '@/modules/importaciones/lib/consolidationDisplay'

interface ShipmentConsolidationPanelProps {
  shipment: Shipment
  consolidation: Consolidation | null
}

export function ShipmentConsolidationPanel({ shipment, consolidation }: ShipmentConsolidationPanelProps) {
  const { updateConsolidation } = useERP()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    status: 'pending' as Consolidation['status'],
    notes: '',
  })

  useEffect(() => {
    if (!consolidation) return
    setForm({
      status: consolidation.status,
      notes: consolidation.notes ?? '',
    })
    setEditing(false)
    setError('')
  }, [consolidation])

  const validation = useMemo(
    () =>
      consolidation && editing
        ? validateConsolidationUpdate({ status: form.status, notes: form.notes })
        : { valid: true, errors: [] },
    [consolidation, editing, form],
  )

  if (!consolidation) {
    const pendingCustoms = ['registered', 'in_transit'].includes(shipment.status)
    return (
      <div className="pt-4 mt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Layers size={16} className="text-corporate" />
          <p className="text-sm font-semibold text-gray-900">Consolidación en almacén</p>
        </div>
        <p className="text-sm text-gray-500">
          {pendingCustoms
            ? 'Se generará automáticamente cuando el embarque pase a aduana.'
            : 'Sin consolidación registrada para este embarque.'}
        </p>
      </div>
    )
  }

  async function handleSave() {
    if (!consolidation || !validation.valid) return
    const result = await updateConsolidation({
      consolidationId: consolidation.id,
      status: form.status,
      notes: form.notes,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al guardar')
      return
    }
    setEditing(false)
    setError('')
  }

  return (
    <div className="pt-4 mt-4 border-t border-gray-100">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-corporate" />
          <p className="text-sm font-semibold text-gray-900">Consolidación en almacén</p>
          <Badge variant={consolidationStatusMap[consolidation.status].variant}>
            {consolidationStatusMap[consolidation.status].label}
          </Badge>
        </div>
        {!editing && consolidation.status !== 'closed' && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-3">
          {error}
        </div>
      )}

      {editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface border border-gray-100 rounded-lg p-4">
          <Input label="Código" value={consolidation.code} disabled />
          <Input label="Almacén destino" value={consolidation.warehouseName ?? '—'} disabled />
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Consolidation['status'] })}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'processed', label: 'Procesado' },
              { value: 'closed', label: 'Cerrado' },
            ]}
          />
          <Input label="Total bultos" value={String(consolidation.totalBultos)} disabled />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate"
            />
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!validation.valid}>
              Guardar consolidación
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1 bg-surface border border-gray-100 rounded-lg px-4 py-3">
          <DetailRow label="Código" value={<span className="font-mono text-xs">{consolidation.code}</span>} />
          <DetailRow label="Almacén destino" value={consolidation.warehouseName ?? '—'} />
          <DetailRow label="Fecha" value={consolidation.date} />
          <DetailRow label="Bultos" value={<span className="font-semibold text-corporate">{consolidation.totalBultos}</span>} />
          {consolidation.weightKg != null && (
            <DetailRow label="Peso (kg)" value={<span className="tabular-nums">{consolidation.weightKg}</span>} />
          )}
          {consolidation.notes?.trim() && (
            <DetailRow label="Observaciones" value={consolidation.notes} />
          )}
        </div>
      )}
    </div>
  )
}
