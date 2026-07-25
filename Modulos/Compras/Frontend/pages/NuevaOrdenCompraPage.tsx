import { useEffect, useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { purchaseStatusLabels } from '@/constants/stateMachines'
import { validatePurchaseOrderCreate } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import type { PurchaseStatus, PurchaseType } from '@/types/domain'
import { useERP } from '@/store/ERPProvider'
import { comprasApi } from '@/services/api/comprasApi'
import { useComprasCatalogos } from '@/modules/compras/hooks/useComprasCatalogos'
import { formatMoney } from '@/lib/money'

interface OrderLine {
  id: string
  product: string
  qty: number
  unitCost: number
  productoId?: number
}

export function NuevaOrdenCompraPage() {
  const { state, createPurchaseOrder } = useERP()
  const catalog = useComprasCatalogos()
  const fromApi = comprasApi.isEnabled()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    orderNumber: '',
    purchaseType: 'national' as PurchaseType,
    supplier: '',
    date: new Date().toISOString().slice(0, 10),
    currency: 'DOP',
    status: 'pending' as PurchaseStatus,
  })
  const [lines, setLines] = useState<OrderLine[]>([{ id: '1', product: '', qty: 1, unitCost: 0 }])

  useEffect(() => {
    if (catalog.loading) return
    setForm((f) => {
      if (f.supplier) return f
      const suppliers = catalog.suppliersForType(f.purchaseType)
      if (!suppliers[0]) return f
      return { ...f, supplier: suppliers[0].nombre }
    })
    setLines((prev) => {
      if (prev[0]?.product || !catalog.productos[0]) return prev
      const p = catalog.productos[0]
      return [{ id: '1', product: p.titulo, qty: 1, unitCost: Number(p.costo.toFixed(2)), productoId: p.id }]
    })
  }, [catalog.loading, catalog.productos, catalog.suppliersForType])

  const supplierOptions = useMemo(
    () =>
      catalog.suppliersForType(form.purchaseType).map((p) => ({
        value: p.nombre,
        label: p.nombre,
      })),
    [catalog, form.purchaseType]
  )

  const productOptions = useMemo(
    () => catalog.productos.map((p) => ({ value: p.titulo, label: p.titulo })),
    [catalog.productos]
  )

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty * line.unitCost, 0),
    [lines]
  )

  const validation = useMemo(() => {
    const codeForValidation = fromApi ? `AUTO-${Date.now()}` : form.orderNumber
    return validatePurchaseOrderCreate(
      codeForValidation,
      form.supplier,
      form.date,
      form.currency,
      lines.map((l) => ({ product: l.product, qty: l.qty, unitCost: l.unitCost, productoId: l.productoId })),
      fromApi ? [] : state.purchaseOrders.map((o) => o.id)
    )
  }, [form, lines, state.purchaseOrders, fromApi])

  function handlePurchaseTypeChange(purchaseType: PurchaseType) {
    const suppliers = catalog.suppliersForType(purchaseType)
    setForm({
      ...form,
      purchaseType,
      supplier: suppliers[0]?.nombre ?? '',
      currency: purchaseType === 'international' ? 'EUR' : 'DOP',
    })
  }

  function addLine() {
    const p = catalog.productos[0]
    setLines((prev) => [
      ...prev,
      {
        id: `line-${prev.length + 1}-${Math.random().toString(36).slice(2, 7)}`,
        product: p?.titulo ?? '',
        qty: 1,
        unitCost: p ? Number(p.costo.toFixed(2)) : 0,
        productoId: p?.id,
      },
    ])
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev))
  }

  function updateLine(id: string, field: keyof OrderLine, value: string | number) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line
        if (field === 'product') {
          const prod = catalog.productos.find((p) => p.titulo === value)
          return {
            ...line,
            product: String(value),
            productoId: prod?.id,
            unitCost: prod ? Number(prod.costo.toFixed(2)) : line.unitCost,
          }
        }
        return { ...line, [field]: value }
      })
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
      subtitle={
        fromApi
          ? 'El código OC se asigna automáticamente vía numeración documental'
          : 'Registro de orden con detalle de productos'
      }
      listPath="/compras/ordenes"
      saveDisabled={!validation.valid || catalog.loading}
      onSave={async () => {
        const result = await createPurchaseOrder({
          orderNumber: fromApi ? '' : trim(form.orderNumber),
          supplier: trim(form.supplier),
          date: form.date,
          currency: form.currency,
          status: form.status,
          purchaseType: form.purchaseType,
          lines: lines.map((l) => ({
            product: trim(l.product),
            qty: Math.round(l.qty),
            unitCost: Number(l.unitCost.toFixed(2)),
            productoId: l.productoId,
          })),
        })
        if (!result.success) {
          setError(result.errors?.join(' ') ?? 'Error al guardar')
          return false
        }
        return true
      }}
    >
      {(error || catalog.error) && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">
          {error || catalog.error}
        </div>
      )}
      {catalog.loading && (
        <p className="text-sm text-gray-500 mb-4">Cargando catálogos (proveedores, productos, monedas)…</p>
      )}
      {!validation.valid && !error && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!fromApi && (
            <Input
              label="Número OC *"
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
            />
          )}
          {fromApi && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número OC</label>
              <p className="py-2 text-sm text-gray-600">Automático (OC-YYYY-######)</p>
            </div>
          )}
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
                ? catalog.currencyCodes.filter((c) => c !== 'DOP').map((c) => ({ value: c, label: c }))
                : catalog.currencyCodes.map((c) => ({ value: c, label: c }))
            }
          />
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as PurchaseStatus })}
            options={Object.entries(purchaseStatusLabels)
              .filter(([v]) => v === 'draft' || v === 'pending')
              .map(([value, label]) => ({ value, label }))}
          />
        </div>

        {form.purchaseType === 'international' && (
          <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            Las compras internacionales no generan Factura de Proveedor en Compras; la Factura Internacional
            pertenece al módulo Importaciones.
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
                <div
                  key={line.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 rounded-lg bg-surface border border-gray-100"
                >
                  <div className="md:col-span-5">
                    <Select
                      label="Producto"
                      value={line.product}
                      onChange={(e) => updateLine(line.id, 'product', e.target.value)}
                      options={productOptions}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Cantidad"
                      type="number"
                      min={1}
                      step={1}
                      value={line.qty}
                      onChange={(e) => updateLine(line.id, 'qty', Math.round(Number(e.target.value) || 1))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Costo unitario"
                      type="number"
                      min={0}
                      step={0.01}
                      value={line.unitCost}
                      onChange={(e) => updateLine(line.id, 'unitCost', Number(Number(e.target.value).toFixed(2)) || 0)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtotal</label>
                    <p className="py-2 text-sm font-semibold text-corporate tabular-nums">
                      {formatMoney(subtotal, form.currency)}
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
            <p className="text-2xl font-bold text-corporate tabular-nums">
              {formatMoney(total, form.currency)}
            </p>
          </div>
        </div>
      </div>
    </FormPageLayout>
  )
}
