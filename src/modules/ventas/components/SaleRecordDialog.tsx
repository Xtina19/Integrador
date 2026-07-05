import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Badge } from '@/components/ui/Badge'

export interface SaleRecord {
  id: string
  date: string
  customer: string
  branch: string
  total: number
  status: 'paid' | 'cancelled'
}

interface SaleRecordDialogProps {
  sale: SaleRecord | null
  open: boolean
  onClose: () => void
}

export function SaleRecordDialog({ sale, open, onClose }: SaleRecordDialogProps) {
  if (!sale) return null

  return (
    <FormDialog open={open} onClose={onClose} title="Detalle de Venta" subtitle={sale.id} mode="view">
      <div className="space-y-1">
        <DetailRow label="Factura" value={<span className="font-mono">{sale.id}</span>} />
        <DetailRow label="Fecha" value={sale.date} />
        <DetailRow label="Cliente" value={sale.customer} />
        <DetailRow label="Sucursal" value={sale.branch} />
        <DetailRow label="Total" value={<span className="font-semibold text-corporate">${sale.total.toLocaleString()}</span>} />
        <DetailRow
          label="Estado"
          value={
            <Badge variant={sale.status === 'paid' ? 'success' : 'danger'}>
              {sale.status === 'paid' ? 'Pagada' : 'Cancelada'}
            </Badge>
          }
        />
      </div>
    </FormDialog>
  )
}
