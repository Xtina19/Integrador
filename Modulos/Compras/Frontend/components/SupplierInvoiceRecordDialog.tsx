import { useEffect, useState } from 'react'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatMoney } from '@/lib/money'
import { invoiceStatusMap } from '@/modules/compras/constants/comprasUi'

export interface SupplierInvoice {
  id: string
  dbId?: number
  supplier: string
  orderId: string
  date: string
  amount: number
  /** Estado de pago UI: pending | partial | paid */
  status: 'paid' | 'pending' | 'partial'
  currency?: string
  /** DER documento: registrada | contabilizada | anulada (sin borrador hoy) */
  documentEstado?: string
  /** DER pago: pendiente | parcial | pagada */
  estadoPago?: string
}

interface SupplierInvoiceRecordDialogProps {
  invoice: SupplierInvoice | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
  onSave: (invoice: SupplierInvoice) => void
  /** Si false, el diálogo no ofrece pasar a editar (solo lectura). */
  allowEdit?: boolean
}

export function SupplierInvoiceRecordDialog({
  invoice,
  mode,
  open,
  onClose,
  onEdit,
  onSave,
  allowEdit = false,
}: SupplierInvoiceRecordDialogProps) {
  const [form, setForm] = useState({
    supplier: '',
    date: '',
    amount: '',
    status: 'pending' as SupplierInvoice['status'],
  })

  useEffect(() => {
    if (!invoice) return
    setForm({
      supplier: invoice.supplier,
      date: invoice.date,
      amount: String(invoice.amount),
      status: invoice.status,
    })
  }, [invoice, mode, open])

  if (!invoice) return null

  const currency = invoice.currency || 'DOP'
  const statusKey =
    invoice.documentEstado === 'anulada' ? 'anulada' : invoice.status
  const statusMeta = invoiceStatusMap[statusKey] ?? {
    label: invoice.status,
    variant: 'warning' as const,
  }

  function handleSave() {
    if (!invoice) return
    onSave({
      ...invoice,
      supplier: form.supplier,
      date: form.date,
      amount: Number(form.amount) || 0,
      status: form.status,
      orderId: invoice.orderId,
    })
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'view' ? 'Detalle de Factura de Proveedor' : 'Editar Factura de Proveedor'}
      subtitle={invoice.id}
      mode={mode}
      onEdit={allowEdit ? onEdit : undefined}
      onSave={handleSave}
    >
      {mode === 'view' ? (
        <div className="space-y-1">
          <DetailRow label="Factura" value={<span className="font-mono">{invoice.id}</span>} />
          <DetailRow label="Proveedor" value={invoice.supplier} />
          <DetailRow label="Orden de compra" value={<span className="font-mono">{invoice.orderId}</span>} />
          <DetailRow label="Fecha" value={invoice.date} />
          <DetailRow
            label="Monto"
            value={
              <span className="font-semibold text-corporate tabular-nums">
                {formatMoney(invoice.amount, currency)}
              </span>
            }
          />
          <DetailRow
            label="Estado de pago"
            value={<Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>}
          />
          {invoice.documentEstado ? (
            <DetailRow
              label="Estado documento"
              value={<span className="capitalize">{invoice.documentEstado}</span>}
            />
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Factura" value={invoice.id} disabled />
          <Input label="Orden de compra" value={invoice.orderId} disabled />
          <Input
            label="Proveedor *"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          />
          <Input
            label="Fecha *"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Input
            label="Monto *"
            type="number"
            min={0}
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as SupplierInvoice['status'] })}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'partial', label: 'Parcial' },
              { value: 'paid', label: 'Pagada' },
            ]}
          />
        </div>
      )}
    </FormDialog>
  )
}
