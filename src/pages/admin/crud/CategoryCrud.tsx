import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminFormLayout } from '../../../components/admin/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '../../../components/admin/AdminDetailLayout'
import { DetailSection, DetailRow } from '../../../components/admin/AdminDetailSection'
import { Input, Select, Textarea } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { Table } from '../../../components/ui/Table'
import { RecordNotFound } from '../../../components/admin/RecordNotFound'
import { ADMIN_MODULES } from '../../../lib/adminConfig'
import { getCategoryById, getCategoryProducts, adminCategories } from '../../../data/adminMockData'
import { validateAdminCategory } from '../../../business-rules/adminValidators'
import { trim } from '../../../utils/formValidation'

const config = ADMIN_MODULES.categorias
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export function CategoryFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = isEdit ? getCategoryById(id!) : null

  if (isEdit && !existing) return <RecordNotFound moduleLabel="categoría" listPath={config.basePath} />

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    description: existing?.description ?? '',
    status: existing?.status ?? 'active',
  })

  const empty = { name: '', description: '', status: 'active' }

  const validation = useMemo(
    () => validateAdminCategory(form, adminCategories.map((c) => c.name), existing?.name),
    [form, existing]
  )

  const saveForm = () => {
    if (!validation.valid) return false
    setForm((f) => ({ ...f, name: trim(f.name), description: trim(f.description) }))
    return true
  }

  return (
    <AdminFormLayout
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: isEdit ? config.editTitle : config.createTitle },
      ]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nueva clasificación de productos'}
      listPath={config.basePath}
      saveDisabled={!validation.valid}
      onSave={saveForm}
      onSaveContinue={
        !isEdit
          ? () => {
              if (!validation.valid) return false
              setForm(empty)
              return true
            }
          : undefined
      }
    >
      {!validation.valid && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Literatura" />
        <Textarea label="Descripción *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Descripción de la categoría..." />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
      </div>
    </AdminFormLayout>
  )
}

export function CategoryDetailPage() {
  const { id } = useParams()
  const category = getCategoryById(id!)
  if (!category) return <RecordNotFound moduleLabel="categoría" listPath={config.basePath} />

  const products = getCategoryProducts(category.name)

  return (
    <AdminDetailLayout
      config={config}
      id={category.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={category.name}
      subtitle={category.id}
      statusBadge={<Badge variant={category.status === 'active' ? 'success' : 'neutral'}>{category.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="ID" value={<span className="font-mono text-gray-500">{category.id}</span>} />
            <DetailRow label="Nombre" value={category.name} />
            <DetailRow label="Descripción" value={category.description} />
            <DetailRow label="Estado" value={<Badge variant={category.status === 'active' ? 'success' : 'neutral'}>{category.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>} />
            <DetailRow label="Productos asociados" value={<span className="font-bold text-corporate">{category.productCount.toLocaleString()}</span>} />
            <DetailRow label="Fecha registro" value={category.createdAt} />
          </dl>
        </DetailSection>

        <DetailSection title="Productos de esta Categoría" subtitle="Muestra representativa">
          <Table
            keyField="id"
            data={products}
            columns={[
              { key: 'code', header: 'Código', render: (p) => <span className="font-mono text-xs text-corporate">{p.code}</span> },
              { key: 'title', header: 'Título', render: (p) => <span className="font-medium">{p.title}</span> },
              { key: 'publisher', header: 'Editorial' },
            ]}
          />
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function CategoryDeletePage() {
  const { id } = useParams()
  const category = getCategoryById(id!)
  if (!category) return <RecordNotFound moduleLabel="categoría" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={category.name}
      recordSubtitle={category.id}
      recordSummary={[
        { label: 'Productos asociados', value: category.productCount.toLocaleString() },
        { label: 'Estado', value: category.status === 'active' ? 'Activo' : 'Inactivo' },
        { label: 'Descripción', value: category.description },
      ]}
    />
  )
}
