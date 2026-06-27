import { useEffect, useState } from 'react'
import type { InternationalInvoice } from '../../types/domain'
import { FormDialog, DetailRow } from '../ui/FormDialog'
import { Input, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Table } from '../ui/Table'
import { importPipelineLabels } from '../../business-rules/internationalPurchaseFlow'
import { getInvoiceProducts } from '../../lib/importSearchUtils'
import { currencyCodes } from '../../data/adminMockData'
import { useERP } from '../../store/ERPProvider'

interface InternationalInvoiceRecordDialogProps {
  invoice: InternationalInvoice | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const invoiceStatusMap: Record<string, { label: string; variant: 'success' | 'warning' }> = {
  paid: { label: 'Pagada', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
}

export function InternationalInvoiceRecordDialog({
  invoice,
  mode,
  open,
  onClose,
  onEdit,
}: InternationalInvoiceRecordDialogProps) {
  const { state, updateInternationalInvoice } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    supplier: '',
    date: '',
    currency: 'EUR',
    amount: '',
    status: 'pending' as InternationalInvoice['status'],
  })

  useEffect(() => {
    if (!invoice) return
    setForm({
      supplier: invoice.supplier,
      date: invoice.date,
      currency: invoice.currency,
      amount: String(invoice.amount),
      status: invoice.status,
    })
    setError('')
  }, [invoice, mode, open])

  if (!invoice) return null

  const products = getInvoiceProducts(state, invoice.orderId)

  function handleSave() {
    const result = updateInternationalInvoice({
      invoiceId: invoice!.id,
      supplier: form.supplier,
      date: form.date,
      currency: form.currency,
      amount: Number(form.amount) || 0,
      status: form.status,
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
      title={mode === 'view' ? 'Detalle de Factura Internacional' : 'Editar Factura Internacional'}
      subtitle={invoice.id}
      mode={mode}
      onEdit={onEdit}
      onSave={handleSave}
      maxWidth="3xl"
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">
          {error}
        </div>
      )}

      {mode === 'view' ? (
        <div className="space-y-6">
          <div className="space-y-1">
            <DetailRow label="Número de factura" value={<span className="font-mono">{invoice.id}</span>} />
            <DetailRow label="Proveedor" value={invoice.supplier} />
            <DetailRow label="Orden de compra" value={<span className="font-mono">{invoice.orderId}</span>} />
            <DetailRow label="Embarque asociado" value={<span className="font-mono">{invoice.shipmentCode ?? '—'}</span>} />
            <DetailRow label="Fecha" value={invoice.date} />
            <DetailRow label="Moneda" value={invoice.currency} />
            <DetailRow
              label="Total factura"
              value={<span className="font-semibold text-corporate">{invoice.amount.toLocaleString()}</span>}
            />
            <DetailRow
              label="Estado del pago"
              value={
                <Badge variant={invoiceStatusMap[invoice.status].variant}>
                  {invoiceStatusMap[invoice.status].label}
                </Badge>
              }
            />
            <DetailRow
              label="Etapa de importación"
              value={<Badge variant="info">{importPipelineLabels[invoice.stage]}</Badge>}
            />
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Productos incluidos</h4>
            {products.length > 0 ? (
              <Table
                keyField="product"
                data={products as { product: string; qty: number; unitCost: number }[]}
                columns={[
                  { key: 'product', header: 'Producto', render: (p) => <span className="font-medium">{p.product}</span> },
                  { key: 'qty', header: 'Cantidad', render: (p) => <span className="font-semibold">{p.qty}</span> },
                  {
                    key: 'unitCost',
                    header: 'Costo unitario',
                    render: (p) => (
                      <span className="text-sm">
                        {invoice.currency} {p.unitCost.toLocaleString()}
                      </span>
                    ),
                  },
                  {
                    key: 'subtotal',
                    header: 'Subtotal',
                    render: (p) => (
                      <span className="font-semibold text-corporate">
                        {invoice.currency} {(p.qty * p.unitCost).toLocaleString()}
                      </span>
                    ),
                  },
                ]}
              />
            ) : (
              <p className="text-sm text-gray-500">Sin líneas de producto en la orden vinculada.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Número de factura" value={invoice.id} disabled />
          <Input label="Orden de compra" value={invoice.orderId} disabled />
          <Input label="Embarque asociado" value={invoice.shipmentCode ?? '—'} disabled />
          <Input label="Proveedor *" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select
            label="Moneda *"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={currencyCodes.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Total factura *"
            type="number"
            min={0}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <Select
            label="Estado del pago *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as InternationalInvoice['status'] })}
            options={[
              { value: 'pending', label: 'Pendiente' },
              { value: 'paid', label: 'Pagada' },
            ]}
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Etapa de importación</label>
            <p className="text-sm text-gray-600 bg-surface border border-gray-100 rounded-lg px-4 py-2">
              {importPipelineLabels[invoice.stage]}
            </p>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
