import { useMemo, useState } from 'react'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { products } from '@/mocks/mockCore'
import { validateCosting } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { useToast } from '@/context/ToastContext'

export function NuevoCosteoPage() {
  const { showSuccess } = useToast()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    product: products[0]?.title ?? '',
    previousCost: '320',
    newCost: '',
    costType: 'Actualización de costo',
    notes: '',
  })

  const validation = useMemo(() => validateCosting(form), [form])

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Nuevo Costeo' },
      ]}
      title="Nuevo Costeo"
      subtitle="Actualización de costo de producto"
      listPath="/inventario"
      saveDisabled={!validation.valid}
      onSave={() => {
        if (!validation.valid) {
          setError(validation.errors.join(' '))
          return false
        }
        showSuccess(`Costeo registrado para ${trim(form.product)}`)
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
        <Input label="Costo anterior" type="number" value={form.previousCost} readOnly className="bg-gray-50" />
        <Input label="Nuevo costo *" type="number" min={0} step="0.01" value={form.newCost} onChange={(e) => setForm({ ...form, newCost: e.target.value })} />
        <Select
          label="Tipo de costeo *"
          value={form.costType}
          onChange={(e) => setForm({ ...form, costType: e.target.value })}
          options={[
            { value: 'Actualización de costo', label: 'Actualización de costo' },
            { value: 'Importación', label: 'Importación' },
            { value: 'Ajuste por flete', label: 'Ajuste por flete' },
            { value: 'Promoción', label: 'Promoción' },
          ]}
          className="md:col-span-2"
        />
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
