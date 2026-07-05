import { useEffect, useState } from 'react'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export interface SupplierInvoice {
  id: string
  supplier: string
  orderId: string
  date: string
  amount: number
  status: 'paid' | 'pending'
}

interface SupplierInvoiceRecordDialogProps {
  invoice: SupplierInvoice | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
  onSave: (invoice: SupplierInvoice) => void
}

export function SupplierInvoiceRecordDialog({
  invoice,
  mode,
  open,
  onClose,
  onEdit,
  onSave,
}: SupplierInvoiceRecordDialogProps) {
  const [form, setForm] = useState({ supplier: '', date: '', amount: '', status: 'pending' as SupplierInvoice['status'] })

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

  function handleSave() {
    if (!invoice) return
    onSave({
      id: invoice.id,
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
      onEdit={onEdit}
      onSave={handleSave}
    >
      {mode === 'view' ? (
        <div className="space-y-1">
          <DetailRow label="Factura" value={<span className="font-mono">{invoice.id}</span>} />
          <DetailRow label="Proveedor" value={invoice.supplier} />
          <DetailRow label="Orden de compra" value={<span className="font-mono">{invoice.orderId}</span>} />
          <DetailRow label="Fecha" value={invoice.date} />
          <DetailRow label="Monto" value={<span className="font-semibold text-corporate">RD${invoice.amount.toLocaleString()}</span>} />
          <DetailRow
            label="Estado"
            value={
              <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
              </Badge>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Factura" value={invoice.id} disabled />
          <Input label="Orden de compra" value={invoice.orderId} disabled />
          <Input label="Proveedor *" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Monto *" type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as SupplierInvoice['status'] })}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'paid', label: 'Pagada' },
            ]}
          />
        </div>
      )}
    </FormDialog>
  )
}
