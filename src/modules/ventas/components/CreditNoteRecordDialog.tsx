import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Badge } from '@/components/ui/Badge'
import type { CreditNote } from '@/modules/ventas/types/salesExchange'
import { CREDIT_NOTE_STATUS_LABELS } from '@/modules/ventas/types/salesExchange'

const statusVariant = {
  active: 'success' as const,
  used: 'neutral' as const,
  expired: 'danger' as const,
}

interface CreditNoteRecordDialogProps {
  note: CreditNote | null
  open: boolean
  onClose: () => void
}

export function CreditNoteRecordDialog({ note, open, onClose }: CreditNoteRecordDialogProps) {
  if (!note) return null

  return (
    <FormDialog open={open} onClose={onClose} title="Nota de Crédito" subtitle={note.id} mode="view">
      <div className="space-y-1">
        <DetailRow label="Número" value={<span className="font-mono">{note.id}</span>} />
        <DetailRow label="Factura relacionada" value={<span className="font-mono">{note.invoiceId}</span>} />
        <DetailRow label="Fecha" value={note.date} />
        <DetailRow label="Motivo" value={note.reason} />
        <DetailRow
          label="Monto"
          value={<span className="font-semibold text-emerald-600">RD${note.amount.toLocaleString()}</span>}
        />
        <DetailRow
          label="Estado"
          value={
            <Badge variant={statusVariant[note.status]}>{CREDIT_NOTE_STATUS_LABELS[note.status]}</Badge>
          }
        />
        <p className="text-xs text-gray-500 pt-3">
          Esta nota puede aplicarse en futuras compras del cliente.
        </p>
      </div>
    </FormDialog>
  )
}
