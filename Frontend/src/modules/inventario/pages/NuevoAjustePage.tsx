import { useMemo, useState } from 'react'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { validateInventoryAdjustment } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { useERP } from '@/store/ERPProvider'

export function NuevoAjustePage() {
  const { state, createAdjustment } = useERP()
  const products = state.products
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    product: products[0]?.title ?? '',
    type: 'Entrada',
    qty: '',
    reason: '',
    notes: '',
  })

  const validation = useMemo(
    () => validateInventoryAdjustment(Number(form.qty) || 0, form.reason, form.product),
    [form.qty, form.reason, form.product]
  )

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Nuevo Ajuste' },
      ]}
      title="Nuevo Ajuste de Inventario"
      subtitle="Entrada, salida o corrección de stock"
      listPath="/inventario"
      saveDisabled={!validation.valid}
      onSave={() => {
        const result = createAdjustment({
          productTitle: trim(form.product),
          type: form.type,
          qty: Number(form.qty),
          reason: trim(form.reason),
          notes: trim(form.notes),
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Producto *"
          value={form.product}
          onChange={(e) => setForm({ ...form, product: e.target.value })}
          options={products.map((p) => ({ value: p.title, label: p.title }))}
          className="md:col-span-2"
        />
        <Select
          label="Tipo de ajuste *"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          options={[
            { value: 'Entrada', label: 'Entrada' },
            { value: 'Salida', label: 'Salida' },
            { value: 'Corrección', label: 'Corrección' },
          ]}
        />
        <Input label="Cantidad *" type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
        <Input label="Motivo *" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="md:col-span-2" />
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-corporate focus:outline-none focus:ring-2 focus:ring-corporate/20"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>
    </FormPageLayout>
  )
}
