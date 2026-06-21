import { useState } from 'react'
import { FormPageLayout } from '../../components/ui/FormPageLayout'
import { Input, Select } from '../../components/ui/Input'
import { products } from '../../data/mockData'

export function NuevoCosteoPage() {
  const [form, setForm] = useState({
    product: products[0]?.title ?? '',
    previousCost: '320',
    newCost: '',
    costType: 'Actualización de costo',
    notes: '',
  })

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Nuevo Costeo' },
      ]}
      title="Nuevo Costeo"
      subtitle="Actualización de costo de producto"
      listPath="/inventario"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Producto *"
          value={form.product}
          onChange={(e) => setForm({ ...form, product: e.target.value })}
          options={products.map((p) => ({ value: p.title, label: p.title }))}
          className="md:col-span-2"
        />
        <Input label="Costo anterior" type="number" value={form.previousCost} readOnly className="bg-gray-50" />
        <Input label="Nuevo costo *" type="number" value={form.newCost} onChange={(e) => setForm({ ...form, newCost: e.target.value })} />
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
