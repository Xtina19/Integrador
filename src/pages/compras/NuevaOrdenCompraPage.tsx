import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormPageLayout } from '../../components/ui/FormPageLayout'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { nationalSupplierNames, internationalSupplierNames, currencyCodes } from '../../data/adminMockData'
import { posProducts } from '../../data/salesMockData'
import { purchaseStatusLabels } from '../../business-rules/stateMachines'
import { validatePurchaseOrderCreate } from '../../business-rules/validators'
import { trim } from '../../utils/formValidation'
import type { PurchaseStatus, PurchaseType } from '../../types/domain'
import { useERP } from '../../store/ERPProvider'

interface OrderLine {
  id: string
  product: string
  qty: number
  unitCost: number
}

export function NuevaOrdenCompraPage() {
  const { state, createPurchaseOrder } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    orderNumber: '',
    purchaseType: 'national' as PurchaseType,
    supplier: nationalSupplierNames[0] ?? '',
    date: new Date().toISOString().slice(0, 10),
    currency: 'DOP',
    status: 'pending' as PurchaseStatus,
  })
  const [lines, setLines] = useState<OrderLine[]>([
    { id: '1', product: posProducts[0]?.title ?? '', qty: 1, unitCost: 320 },
  ])

  const supplierOptions = useMemo(
    () =>
      (form.purchaseType === 'international' ? internationalSupplierNames : nationalSupplierNames).map((name) => ({
        value: name,
        label: name,
      })),
    [form.purchaseType]
  )

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty * line.unitCost, 0),
    [lines]
  )

  const validation = useMemo(
    () =>
      validatePurchaseOrderCreate(
        form.orderNumber,
        form.supplier,
        form.date,
        form.currency,
        lines.map((l) => ({ product: l.product, qty: l.qty, unitCost: l.unitCost })),
        state.purchaseOrders.map((o) => o.id)
      ),
    [form, lines, state.purchaseOrders]
  )

  function handlePurchaseTypeChange(purchaseType: PurchaseType) {
    const names = purchaseType === 'international' ? internationalSupplierNames : nationalSupplierNames
    setForm({
      ...form,
      purchaseType,
      supplier: names[0] ?? '',
      currency: purchaseType === 'international' ? 'EUR' : 'DOP',
    })
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { id: String(Date.now()), product: posProducts[0]?.title ?? '', qty: 1, unitCost: 0 },
    ])
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  }

  function updateLine(id: string, field: keyof OrderLine, value: string | number) {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, [field]: value } : line))
    )
  }

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Compras', to: '/compras' },
        { label: 'Órdenes', to: '/compras/ordenes' },
        { label: 'Nueva Orden' },
      ]}
      title="Nueva Orden de Compra"
      subtitle="Registro de orden con detalle de productos"
      listPath="/compras/ordenes"
      saveDisabled={!validation.valid}
      onSave={() => {
        const result = createPurchaseOrder({
          orderNumber: trim(form.orderNumber),
          supplier: trim(form.supplier),
          date: form.date,
          currency: form.currency,
          status: form.status,
          purchaseType: form.purchaseType,
          lines: lines.map((l) => ({ product: trim(l.product), qty: l.qty, unitCost: l.unitCost })),
        })
        if (!result.success) {
          setError(result.errors?.join(' ') ?? 'Error al guardar')
          return false
        }
        return true
      }}
    >
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">{error}</div>}
      {!validation.valid && !error && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input label="Número OC *" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} />
          <Select
            label="Tipo de Compra *"
            value={form.purchaseType}
            onChange={(e) => handlePurchaseTypeChange(e.target.value as PurchaseType)}
            options={[
              { value: 'national', label: 'Nacional' },
              { value: 'international', label: 'Internacional' },
            ]}
          />
          <Select
            label="Proveedor *"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            options={supplierOptions}
          />
          <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select
            label="Moneda *"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={
              form.purchaseType === 'international'
                ? currencyCodes.filter((c) => c !== 'DOP').map((c) => ({ value: c, label: c }))
                : currencyCodes.map((c) => ({ value: c, label: c }))
            }
          />
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as PurchaseStatus })}
            options={Object.entries(purchaseStatusLabels).map(([value, label]) => ({ value, label }))}
          />
        </div>

        {form.purchaseType === 'international' && (
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            Al aprobar esta orden se generará una <strong>Factura Internacional</strong> y quedará disponible en el módulo de Importaciones para registrar embarque, costos y recepción.
          </p>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Detalle de productos</h3>
            <Button type="button" size="sm" variant="outline" icon={Plus} onClick={addLine}>
              Agregar línea
            </Button>
          </div>
          <div className="space-y-3">
            {lines.map((line) => {
              const subtotal = line.qty * line.unitCost
              return (
                <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 rounded-lg bg-surface border border-gray-100">
                  <div className="md:col-span-5">
                    <Select
                      label="Producto"
                      value={line.product}
                      onChange={(e) => updateLine(line.id, 'product', e.target.value)}
                      options={posProducts.map((p) => ({ value: p.title, label: p.title }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Cantidad"
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) => updateLine(line.id, 'qty', Number(e.target.value) || 1)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Costo unitario"
                      type="number"
                      min={0}
                      value={line.unitCost}
                      onChange={(e) => updateLine(line.id, 'unitCost', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtotal</label>
                    <p className="py-2 text-sm font-semibold text-corporate">
                      {form.currency === 'DOP' ? 'RD$' : form.currency === 'EUR' ? '€' : '$'}
                      {subtotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Eliminar línea"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total de la orden</p>
            <p className="text-2xl font-bold text-corporate">
              {form.currency === 'DOP' ? 'RD$' : form.currency === 'EUR' ? '€' : '$'}
              {total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </FormPageLayout>
  )
}
