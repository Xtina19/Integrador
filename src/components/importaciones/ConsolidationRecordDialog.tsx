import { useEffect, useState } from 'react'
import type { Consolidation } from '../../types/domain'
import { FormDialog, DetailRow } from '../ui/FormDialog'
import { Input, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { useERP } from '../../store/ERPProvider'

interface ConsolidationRecordDialogProps {
  consolidation: Consolidation | null
  shipmentCodes: string[]
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const consolidationStatusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activa', variant: 'success' },
  closed: { label: 'Cerrada', variant: 'neutral' },
}

export function ConsolidationRecordDialog({
  consolidation,
  shipmentCodes,
  mode,
  open,
  onClose,
  onEdit,
}: ConsolidationRecordDialogProps) {
  const { updateConsolidation } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    status: 'active' as Consolidation['status'],
    notes: '',
  })

  useEffect(() => {
    if (!consolidation) return
    setForm({
      name: consolidation.name,
      status: consolidation.status,
      notes: consolidation.notes ?? '',
    })
    setError('')
  }, [consolidation, mode, open])

  if (!consolidation) return null

  function handleSave() {
    const result = updateConsolidation({
      consolidationId: consolidation!.id,
      name: form.name,
      status: form.status,
      notes: form.notes,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al guardar')
      return
    }
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'view' ? 'Detalle de Consolidación' : 'Editar Consolidación'}
      subtitle={consolidation.id}
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
          <DetailRow label="Código" value={<span className="font-mono">{consolidation.id}</span>} />
          <DetailRow label="Nombre" value={consolidation.name} />
          <DetailRow
            label="Órdenes incluidas"
            value={
              consolidation.orderIds.length
                ? consolidation.orderIds.map((id) => (
                    <span key={id} className="inline-block font-mono text-xs bg-surface px-2 py-0.5 rounded mr-1 mb-1">
                      {id}
                    </span>
                  ))
                : '—'
            }
          />
          <DetailRow
            label="Embarques asociados"
            value={
              shipmentCodes.length
                ? shipmentCodes.map((code) => (
                    <span key={code} className="inline-block font-mono text-xs bg-surface px-2 py-0.5 rounded mr-1 mb-1">
                      {code}
                    </span>
                  ))
                : '—'
            }
          />
          <DetailRow label="Total cajas" value={<span className="font-semibold text-corporate">{consolidation.totalBoxes}</span>} />
          <DetailRow
            label="Estado"
            value={
              <Badge variant={consolidationStatusMap[consolidation.status].variant}>
                {consolidationStatusMap[consolidation.status].label}
              </Badge>
            }
          />
          <DetailRow label="Observaciones" value={consolidation.notes?.trim() ? consolidation.notes : '—'} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Código" value={consolidation.id} disabled />
          <Input label="Total cajas" value={String(consolidation.totalBoxes)} disabled />
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="md:col-span-2"
          />
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Consolidation['status'] })}
            options={[
              { value: 'active', label: 'Activa' },
              { value: 'closed', label: 'Cerrada' },
            ]}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Órdenes incluidas</label>
            <p className="text-sm text-gray-600 bg-surface border border-gray-100 rounded-lg px-4 py-2 font-mono">
              {consolidation.orderIds.join(', ') || '—'}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Embarques asociados</label>
            <p className="text-sm text-gray-600 bg-surface border border-gray-100 rounded-lg px-4 py-2 font-mono">
              {shipmentCodes.join(', ') || '—'}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate/20 focus:border-corporate"
              placeholder="Notas de la consolidación..."
            />
          </div>
        </div>
      )}
    </FormDialog>
  )
}
