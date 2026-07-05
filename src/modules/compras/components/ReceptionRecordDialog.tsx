import { useEffect, useMemo, useState } from 'react'
import type { Reception } from '@/types/domain'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { validateReceptionUpdate } from '@/business-rules/validators'
import { useERP } from '@/store/ERPProvider'

interface ReceptionRecordDialogProps {
  reception: Reception | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

export function ReceptionRecordDialog({
  reception,
  mode,
  open,
  onClose,
  onEdit,
}: ReceptionRecordDialogProps) {
  const { updateReception } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({ date: '', items: '' })

  useEffect(() => {
    if (!reception) return
    setForm({ date: reception.date, items: String(reception.items) })
    setError('')
  }, [reception, mode, open])

  const validation = useMemo(
    () =>
      reception && mode === 'edit'
        ? validateReceptionUpdate({ date: form.date, items: Number(form.items) || 0 })
        : { valid: true, errors: [] },
    [form, mode, reception]
  )

  if (!reception) return null

  const canEdit = reception.status === 'pending'

  function handleSave() {
    const result = updateReception({
      receptionId: reception!.id,
      date: form.date,
      items: Number(form.items) || 0,
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
      title={mode === 'view' ? 'Detalle de Recepción' : 'Editar Recepción'}
      subtitle={reception.id}
      mode={mode}
      onEdit={canEdit ? onEdit : undefined}
      onSave={handleSave}
      saveDisabled={mode === 'edit' && !validation.valid}
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>
      )}

      {mode === 'view' ? (
        <div className="space-y-1">
          <DetailRow label="Recepción" value={<span className="font-mono">{reception.id}</span>} />
          <DetailRow label="Orden de compra" value={<span className="font-mono">{reception.orderId}</span>} />
          <DetailRow label="Proveedor" value={reception.supplier} />
          <DetailRow
            label="Origen"
            value={
              <Badge variant={reception.purchaseType === 'international' ? 'info' : 'neutral'}>
                {reception.purchaseType === 'international' ? 'Importación' : 'Nacional'}
              </Badge>
            }
          />
          <DetailRow label="Fecha" value={reception.date} />
          <DetailRow label="Ítems recibidos" value={reception.items} />
          <DetailRow
            label="Estado"
            value={
              <Badge variant={reception.status === 'complete' ? 'success' : 'warning'}>
                {reception.status === 'complete' ? 'Completa' : 'Pendiente'}
              </Badge>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Recepción" value={reception.id} disabled />
          <Input label="Orden de compra" value={reception.orderId} disabled />
          <Input label="Proveedor" value={reception.supplier} disabled />
          <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input
            label="Ítems recibidos *"
            type="number"
            min={0}
            value={form.items}
            onChange={(e) => setForm({ ...form, items: e.target.value })}
          />
        </div>
      )}
    </FormDialog>
  )
}
