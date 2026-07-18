import { useMemo, useState } from 'react'
import { FormPageLayout } from '@/components/ui/FormPageLayout'
import { Input, Select } from '@/components/ui/Input'
import { categories } from '@/mocks/mockCore'
import { publisherNames, adminSuppliers } from '@/mocks/mockAdmin'
import { validateProduct } from '@/business-rules/validators'
import { trim } from '@/utils/formValidation'
import { useERP } from '@/store/ERPProvider'

export function NuevoProductoPage() {
  const { state, createProduct } = useERP()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    code: '',
    isbn: '',
    name: '',
    category: categories[0] ?? '',
    publisher: publisherNames[0] ?? '',
    supplier: adminSuppliers[0]?.name ?? '',
    cost: '',
    price: '',
    stock: '',
    minStock: '',
    location: '',
    status: 'active',
  })

  const validation = useMemo(
    () =>
      validateProduct(
        form,
        state.products.map((p) => p.id),
        state.products.map((p) => p.isbn)
      ),
    [form, state.products]
  )

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Nuevo Producto' },
      ]}
      title="Nuevo Producto"
      listPath="/inventario"
      saveDisabled={!validation.valid}
      onSave={() => {
        const result = createProduct({
          code: trim(form.code),
          isbn: trim(form.isbn),
          name: trim(form.name),
          category: form.category,
          publisher: form.publisher,
          stock: Number(form.stock) || 0,
          minStock: Number(form.minStock) || 0,
          location: trim(form.location),
          cost: Number(form.cost) || 0,
          price: Number(form.price) || 0,
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
        <Input label="Código *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <Input label="ISBN *" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Select label="Categoría *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories.map((c) => ({ value: c, label: c }))} />
        <Select label="Editorial *" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} options={publisherNames.map((p) => ({ value: p, label: p }))} />
        <Select label="Proveedor *" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} options={adminSuppliers.map((s) => ({ value: s.name, label: s.name }))} />
        <Input label="Costo *" type="number" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        <Input label="Precio venta *" type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input label="Stock inicial *" type="number" min={0} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <Input label="Stock mínimo *" type="number" min={0} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
        <Input label="Ubicación *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="md:col-span-2" />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]} />
      </div>
    </FormPageLayout>
  )
}
