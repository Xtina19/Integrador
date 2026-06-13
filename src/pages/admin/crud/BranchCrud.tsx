import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminFormLayout } from '../../../components/admin/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '../../../components/admin/AdminDetailLayout'
import { DetailSection, DetailRow } from '../../../components/admin/AdminDetailSection'
import { Input, Select } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { RecordNotFound } from '../../../components/admin/RecordNotFound'
import { ADMIN_MODULES } from '../../../lib/adminConfig'
import { getBranchById } from '../../../data/adminMockData'

const config = ADMIN_MODULES.sucursales
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export function BranchFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = isEdit ? getBranchById(id!) : null

  if (isEdit && !existing) return <RecordNotFound moduleLabel="sucursal" listPath={config.basePath} />

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    address: existing?.address ?? '',
    city: existing?.city ?? '',
    phone: existing?.phone ?? '',
    manager: existing?.manager ?? '',
    status: existing?.status ?? 'active',
  })

  const empty = { name: '', address: '', city: '', phone: '', manager: '', status: 'active' }

  return (
    <AdminFormLayout
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: isEdit ? config.editTitle : config.createTitle }]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nueva ubicación de Librería Joselito'}
      listPath={config.basePath}
      onSaveContinue={!isEdit ? () => setForm(empty) : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Input label="Dirección *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
        <Input label="Ciudad *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label="Teléfono *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Encargado *" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
      </div>
    </AdminFormLayout>
  )
}

export function BranchDetailPage() {
  const { id } = useParams()
  const branch = getBranchById(id!)
  if (!branch) return <RecordNotFound moduleLabel="sucursal" listPath={config.basePath} />

  return (
    <AdminDetailLayout
      config={config}
      id={branch.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={branch.name}
      subtitle={branch.city}
      statusBadge={<Badge variant={branch.status === 'active' ? 'success' : 'neutral'}>{branch.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="Nombre" value={branch.name} />
            <DetailRow label="Ciudad" value={branch.city} />
            <DetailRow label="Dirección" value={branch.address} />
            <DetailRow label="Teléfono" value={branch.phone} />
            <DetailRow label="Encargado" value={branch.manager} />
            <DetailRow label="Estado" value={<Badge variant={branch.status === 'active' ? 'success' : 'neutral'}>{branch.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>} />
          </dl>
        </DetailSection>

        <DetailSection title="Inventario Asociado">
          <div className="text-center py-6">
            <p className="text-4xl font-bold text-corporate">{branch.inventory.toLocaleString()}</p>
            <p className="text-sm text-gold-dark font-medium mt-1">unidades en stock</p>
            <p className="text-xs text-gray-500 mt-3">Inventario compartido sincronizado con almacén central</p>
          </div>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function BranchDeletePage() {
  const { id } = useParams()
  const branch = getBranchById(id!)
  if (!branch) return <RecordNotFound moduleLabel="sucursal" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={branch.name}
      recordSubtitle={branch.city}
      recordSummary={[
        { label: 'Encargado', value: branch.manager },
        { label: 'Inventario', value: `${branch.inventory.toLocaleString()} uds.` },
        { label: 'Teléfono', value: branch.phone },
        { label: 'Estado', value: branch.status === 'active' ? 'Activo' : 'Inactivo' },
      ]}
    />
  )
}
