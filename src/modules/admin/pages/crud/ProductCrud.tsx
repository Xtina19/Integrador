import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { getProductById, getProductHistory, publisherNames, categoryNames, currencyCodes, adminProducts } from '@/mocks/mockAdmin'
import { validateAdminProduct } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'

const config = ADMIN_MODULES.productos
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const emptyForm = {
  code: '',
  isbn: '',
  title: '',
  author: '',
  category: categoryNames[0] ?? '',
  publisher: publisherNames[0] ?? '',
  price: '',
  currency: currencyCodes[0] ?? 'DOP',
  status: 'active',
  notes: '',
}

export function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = isEdit ? getProductById(id!) : null

  if (isEdit && !existing) {
    return <RecordNotFound moduleLabel="producto" listPath={config.basePath} />
  }

  const [form, setForm] = useState(
    existing
      ? {
          code: existing!.code,
          isbn: existing!.isbn,
          title: existing!.title,
          author: existing!.author,
          category: existing!.category,
          publisher: existing!.publisher,
          price: String(existing!.price),
          currency: existing!.currency,
          status: existing!.status,
          notes: '',
        }
      : emptyForm
  )

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const validation = useMemo(
    () =>
      validateAdminProduct(
        form,
        adminProducts.map((p) => p.code),
        adminProducts.map((p) => p.isbn),
        existing?.code,
        existing?.isbn
      ),
    [form, existing]
  )

  const saveForm = () => {
    if (!validation.valid) return false
    setForm((f) => ({
      ...f,
      code: trim(f.code),
      isbn: trim(f.isbn),
      title: trim(f.title),
      author: trim(f.author),
      notes: trim(f.notes),
    }))
    return true
  }

  return (
    <AdminFormLayout
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: isEdit ? config.editTitle : config.createTitle },
      ]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.code}` : 'Registro en catálogo maestro'}
      listPath={config.basePath}
      saveDisabled={!validation.valid}
      onSave={saveForm}
      onSaveContinue={
        !isEdit
          ? () => {
              if (!validation.valid) return false
              setForm(emptyForm)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Código Interno *" value={form.code} onChange={(e) => update('code', e.target.value)} placeholder="LJS-011" />
        <Input label="ISBN *" value={form.isbn} onChange={(e) => update('isbn', e.target.value)} placeholder="978-XXXXXXXXXX" />
        <Input label="Título *" value={form.title} onChange={(e) => update('title', e.target.value)} className="md:col-span-2" />
        <Input label="Autor" value={form.author} onChange={(e) => update('author', e.target.value)} className="md:col-span-2" />
        <Select label="Categoría *" value={form.category} onChange={(e) => update('category', e.target.value)} options={categoryNames.map((c) => ({ value: c, label: c }))} />
        <Select label="Editorial *" value={form.publisher} onChange={(e) => update('publisher', e.target.value)} options={publisherNames.map((p) => ({ value: p, label: p }))} />
        <Input label="Precio *" type="number" value={form.price} onChange={(e) => update('price', e.target.value)} />
        <Select label="Moneda *" value={form.currency} onChange={(e) => update('currency', e.target.value)} options={currencyCodes.map((c) => ({ value: c, label: c }))} />
        <Select label="Estado" value={form.status} onChange={(e) => update('status', e.target.value)} options={statusOptions} />
        <Textarea label="Notas internas" value={form.notes} onChange={(e) => update('notes', e.target.value)} className="md:col-span-2" rows={3} />
      </div>
    </AdminFormLayout>
  )
}

export function ProductDetailPage() {
  const { id } = useParams()
  const product = getProductById(id!)

  if (!product) return <RecordNotFound moduleLabel="producto" listPath={config.basePath} />

  const history = getProductHistory(product.id)

  return (
    <AdminDetailLayout
      config={config}
      id={product.id}
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: config.detailTitle },
      ]}
      title={product.title}
      subtitle={`${product.code} · ISBN ${product.isbn}`}
      statusBadge={
        <Badge variant={product.status === 'active' ? 'success' : 'neutral'}>
          {product.status === 'active' ? 'Activo' : 'Inactivo'}
        </Badge>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="Código Interno" value={<span className="font-mono text-corporate">{product.code}</span>} />
            <DetailRow label="ISBN" value={<span className="font-mono">{product.isbn}</span>} />
            <DetailRow label="Autor" value={product.author} />
            <DetailRow label="Estado" value={<Badge variant={product.status === 'active' ? 'success' : 'neutral'}>{product.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>} />
            <DetailRow label="Fecha registro" value={product.createdAt} />
            <DetailRow label="Última actualización" value={product.updatedAt} />
          </dl>
        </DetailSection>

        <DetailSection title="Clasificación y Precio">
          <dl>
            <DetailRow label="Categoría" value={<Badge variant="neutral">{product.category}</Badge>} />
            <DetailRow label="Editorial" value={product.publisher} />
            <DetailRow label="Precio" value={<span className="text-lg font-bold text-corporate">RD${product.price.toLocaleString()}</span>} />
            <DetailRow label="Moneda" value={<Badge variant="gold">{product.currency}</Badge>} />
          </dl>
        </DetailSection>
      </div>

      <DetailSection title="Historial de Cambios">
        <Table
          keyField="id"
          data={history.length > 0 ? history : [{ id: 0, productId: product.id, action: 'Sin registros', detail: '—', user: '—', date: '—' }]}
          columns={[
            { key: 'date', header: 'Fecha', className: 'text-xs text-gray-500' },
            { key: 'action', header: 'Acción', render: (h) => <span className="font-medium">{h.action}</span> },
            { key: 'detail', header: 'Detalle' },
            { key: 'user', header: 'Usuario' },
          ]}
        />
      </DetailSection>
    </AdminDetailLayout>
  )
}

export function ProductDeletePage() {
  const { id } = useParams()
  const product = getProductById(id!)

  if (!product) return <RecordNotFound moduleLabel="producto" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: config.deleteTitle },
      ]}
      recordTitle={product.title}
      recordSubtitle={`${product.code} · ${product.publisher}`}
      recordSummary={[
        { label: 'ISBN', value: product.isbn },
        { label: 'Categoría', value: product.category },
        { label: 'Precio', value: `RD$${product.price.toLocaleString()}` },
        { label: 'Estado', value: product.status === 'active' ? 'Activo' : 'Inactivo' },
      ]}
    />
  )
}
