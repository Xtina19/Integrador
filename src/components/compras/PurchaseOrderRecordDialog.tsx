import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { PurchaseOrder, PurchaseOrderLine, PurchaseType } from '../../types/domain'
import { FormDialog, DetailRow } from '../ui/FormDialog'
import { Input, Select } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { Table } from '../ui/Table'
import { Button } from '../ui/Button'
import { purchaseStatusLabels } from '../../business-rules/stateMachines'
import { nationalSupplierNames, internationalSupplierNames, currencyCodes } from '../../data/adminMockData'
import { posProducts } from '../../data/salesMockData'
import { useERP } from '../../store/ERPProvider'
import { useToast } from '../../context/ToastContext'

interface PurchaseOrderRecordDialogProps {
  order: PurchaseOrder | null
  mode: 'view' | 'edit'
  open: boolean
  onClose: () => void
  onEdit: () => void
}

const purchaseStatusVariants: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'info',
  received: 'success',
  finalized: 'success',
  cancelled: 'danger',
}

export function PurchaseOrderRecordDialog({
  order,
  mode,
  open,
  onClose,
  onEdit,
}: PurchaseOrderRecordDialogProps) {
  const { updatePurchaseOrder } = useERP()
  const { showSuccess } = useToast()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    supplier: '',
    date: '',
    currency: 'DOP',
    purchaseType: 'national' as PurchaseType,
  })
  const [lines, setLines] = useState<PurchaseOrderLine[]>([])

  useEffect(() => {
    if (!order) return
    setForm({
      supplier: order.supplier,
      date: order.date,
      currency: order.currency,
      purchaseType: order.purchaseType,
    })
    setLines(order.lines?.length ? [...order.lines] : [{ product: 'Ítems generales', qty: order.items, unitCost: order.total / Math.max(order.items, 1) }])
    setError('')
  }, [order, mode, open])

  const supplierOptions =
    form.purchaseType === 'international' ? internationalSupplierNames : nationalSupplierNames

  if (!order) return null

  const total = lines.reduce((s, l) => s + l.qty * l.unitCost, 0)
  const canEdit = order.status === 'draft' || order.status === 'pending'

  function handleSave() {
    const result = updatePurchaseOrder({
      orderId: order!.id,
      supplier: form.supplier,
      date: form.date,
      currency: form.currency,
      purchaseType: form.purchaseType,
      lines,
    })
    if (!result.success) {
      setError(result.errors?.join(' ') ?? 'Error al guardar')
      return
    }
    showSuccess('Orden de compra actualizada correctamente')
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={mode === 'view' ? 'Detalle de Orden de Compra' : 'Editar Orden de Compra'}
      subtitle={order.id}
      mode={mode}
      onEdit={canEdit ? onEdit : undefined}
      onSave={handleSave}
      maxWidth="3xl"
    >
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>
      )}

      {mode === 'view' ? (
        <div className="space-y-6">
          <div className="space-y-1">
            <DetailRow label="Código" value={<span className="font-mono">{order.id}</span>} />
            <DetailRow label="Proveedor" value={order.supplier} />
            <DetailRow
              label="Tipo"
              value={
                <Badge variant={order.purchaseType === 'international' ? 'info' : 'neutral'}>
                  {order.purchaseType === 'international' ? 'Internacional' : 'Nacional'}
                </Badge>
              }
            />
            <DetailRow label="Fecha" value={order.date} />
            <DetailRow label="Moneda" value={order.currency} />
            <DetailRow label="Ítems" value={order.items} />
            <DetailRow
              label="Total"
              value={
                <span className="font-semibold text-corporate">
                  {order.currency === 'DOP' ? 'RD$' : order.currency === 'EUR' ? '€' : '$'}
                  {order.total.toLocaleString()}
                </span>
              }
            />
            <DetailRow
              label="Estado"
              value={
                <Badge variant={purchaseStatusVariants[order.status]}>
                  {purchaseStatusLabels[order.status]}
                </Badge>
              }
            />
          </div>
          {(order.lines?.length ?? 0) > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Líneas de producto</h4>
              <Table
                keyField="product"
                data={order.lines as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'product', header: 'Producto', render: (l) => <span className="font-medium">{(l as unknown as PurchaseOrderLine).product}</span> },
                  { key: 'qty', header: 'Cantidad', render: (l) => (l as unknown as PurchaseOrderLine).qty },
                  { key: 'unitCost', header: 'Costo unit.', render: (l) => (l as unknown as PurchaseOrderLine).unitCost.toLocaleString() },
                  {
                    key: 'subtotal',
                    header: 'Subtotal',
                    render: (l) => {
                      const line = l as unknown as PurchaseOrderLine
                      return (
                        <span className="font-semibold text-corporate">{(line.qty * line.unitCost).toLocaleString()}</span>
                      )
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {!canEdit && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2">
              Solo se pueden editar órdenes en borrador o pendientes.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Código" value={order.id} disabled />
            <Select
              label="Tipo de compra *"
              value={form.purchaseType}
              onChange={(e) => {
                const purchaseType = e.target.value as PurchaseType
                const names = purchaseType === 'international' ? internationalSupplierNames : nationalSupplierNames
                setForm({
                  ...form,
                  purchaseType,
                  supplier: names[0] ?? '',
                  currency: purchaseType === 'international' ? 'EUR' : 'DOP',
                })
              }}
              options={[
                { value: 'national', label: 'Nacional' },
                { value: 'international', label: 'Internacional' },
              ]}
            />
            <Select
              label="Proveedor *"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              options={supplierOptions.map((s) => ({ value: s, label: s }))}
            />
            <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Select
              label="Moneda *"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={currencyCodes.map((c) => ({ value: c, label: c }))}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Líneas de producto</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setLines((prev) => [...prev, { product: posProducts[0]?.title ?? '', qty: 1, unitCost: 0 }])
                }
              >
                Agregar línea
              </Button>
            </div>
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 bg-surface rounded-lg">
                  <div className="md:col-span-5">
                    <Select
                      label="Producto"
                      value={line.product}
                      onChange={(e) =>
                        setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, product: e.target.value } : l)))
                      }
                      options={posProducts.map((p) => ({ value: p.title, label: p.title }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Cantidad"
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) => (i === idx ? { ...l, qty: Number(e.target.value) || 0 } : l))
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Input
                      label="Costo unit."
                      type="number"
                      min={0}
                      value={line.unitCost}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((l, i) => (i === idx ? { ...l, unitCost: Number(e.target.value) || 0 } : l))
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={Trash2}
                      onClick={() => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm font-semibold text-corporate mt-4 text-right">
              Total: {form.currency} {total.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
