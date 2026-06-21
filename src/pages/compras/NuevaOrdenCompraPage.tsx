import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { FormPageLayout } from '../../components/ui/FormPageLayout'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { adminSuppliers } from '../../data/adminMockData'
import { currencyCodes } from '../../data/adminMockData'
import { posProducts } from '../../data/salesMockData'
import { purchaseStatusMap } from '../../data/purchasesMockData'

interface OrderLine {
  id: string
  product: string
  qty: number
  unitCost: number
}

export function NuevaOrdenCompraPage() {
  const [form, setForm] = useState({
    orderNumber: 'OC-2026-090',
    supplier: adminSuppliers[0]?.name ?? '',
    date: new Date().toISOString().slice(0, 10),
    currency: currencyCodes[0] ?? 'DOP',
    status: 'draft',
  })
  const [lines, setLines] = useState<OrderLine[]>([
    { id: '1', product: posProducts[0]?.title ?? '', qty: 1, unitCost: 320 },
  ])

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.qty * line.unitCost, 0),
    [lines]
  )

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
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Input label="Número OC *" value={form.orderNumber} onChange={(e) => setForm({ ...form, orderNumber: e.target.value })} />
          <Select
            label="Proveedor *"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            options={adminSuppliers.map((s) => ({ value: s.name, label: s.name }))}
          />
          <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Select
            label="Moneda *"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            options={currencyCodes.map((c) => ({ value: c, label: c }))}
          />
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={Object.entries(purchaseStatusMap).map(([value, cfg]) => ({ value, label: cfg.label }))}
          />
        </div>

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
                    <p className="py-2 text-sm font-semibold text-corporate">RD${subtotal.toLocaleString()}</p>
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
            <p className="text-2xl font-bold text-corporate">RD${total.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </FormPageLayout>
  )
}
