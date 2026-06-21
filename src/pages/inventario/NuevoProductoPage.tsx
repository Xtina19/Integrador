import { useState } from 'react'
import { FormPageLayout } from '../../components/ui/FormPageLayout'
import { Input, Select } from '../../components/ui/Input'
import { categories } from '../../data/mockData'
import { publisherNames, adminSuppliers } from '../../data/adminMockData'

export function NuevoProductoPage() {
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

  return (
    <FormPageLayout
      breadcrumbs={[
        { label: 'Inventario', to: '/inventario' },
        { label: 'Nuevo Producto' },
      ]}
      title="Nuevo Producto"
      subtitle="Registro de producto en inventario"
      listPath="/inventario"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Código *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <Input label="ISBN *" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Select label="Categoría *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={categories.map((c) => ({ value: c, label: c }))} />
        <Select label="Editorial *" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} options={publisherNames.map((p) => ({ value: p, label: p }))} />
        <Select label="Proveedor *" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} options={adminSuppliers.map((s) => ({ value: s.name, label: s.name }))} />
        <Input label="Costo *" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
        <Input label="Precio venta *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <Input label="Stock inicial *" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <Input label="Stock mínimo *" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
        <Input label="Ubicación *" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="md:col-span-2" />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]} />
      </div>
    </FormPageLayout>
  )
}
