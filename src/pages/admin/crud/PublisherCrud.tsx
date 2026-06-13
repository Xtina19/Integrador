import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Globe, Mail } from 'lucide-react'
import { AdminFormLayout } from '../../../components/admin/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '../../../components/admin/AdminDetailLayout'
import { DetailSection, DetailRow } from '../../../components/admin/AdminDetailSection'
import { Input, Select } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { Table } from '../../../components/ui/Table'
import { RecordNotFound } from '../../../components/admin/RecordNotFound'
import { ADMIN_MODULES } from '../../../lib/adminConfig'
import { getPublisherById, getPublisherContracts, getPublisherProducts } from '../../../data/adminMockData'

const config = ADMIN_MODULES.editoriales
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]
const contractTypes = [
  'Distribución exclusiva',
  'Distribución regional',
  'Distribución nacional',
  'Convenio institucional',
]

export function PublisherFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = isEdit ? getPublisherById(id!) : null

  if (isEdit && !existing) return <RecordNotFound moduleLabel="editorial" listPath={config.basePath} />

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    country: existing?.country ?? '',
    contact: existing?.contact ?? '',
    phone: existing?.phone ?? '',
    address: existing?.address ?? '',
    contractType: existing?.contractType ?? contractTypes[0],
    contractExpiry: existing?.contractExpiry ?? '',
    status: existing?.status ?? 'active',
  })

  const empty = { name: '', country: '', contact: '', phone: '', address: '', contractType: contractTypes[0], contractExpiry: '', status: 'active' }

  return (
    <AdminFormLayout
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: isEdit ? config.editTitle : config.createTitle }]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nueva editorial en catálogo maestro'}
      listPath={config.basePath}
      onSaveContinue={!isEdit ? () => setForm(empty) : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Input label="País *" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <Input label="Contacto *" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
        <Select label="Tipo de Contrato *" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} options={contractTypes.map((t) => ({ value: t, label: t }))} />
        <Input label="Vencimiento contrato" type="date" value={form.contractExpiry} onChange={(e) => setForm({ ...form, contractExpiry: e.target.value })} />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
      </div>
    </AdminFormLayout>
  )
}

export function PublisherDetailPage() {
  const { id } = useParams()
  const publisher = getPublisherById(id!)
  if (!publisher) return <RecordNotFound moduleLabel="editorial" listPath={config.basePath} />

  const contracts = getPublisherContracts(publisher.id)
  const products = getPublisherProducts(publisher.name)

  return (
    <AdminDetailLayout
      config={config}
      id={publisher.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={publisher.name}
      subtitle={publisher.country}
      statusBadge={<Badge variant={publisher.status === 'active' ? 'success' : 'neutral'}>{publisher.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Datos Generales">
          <dl>
            <DetailRow label="País" value={<div className="flex items-center gap-1.5"><Globe size={14} className="text-gray-400" />{publisher.country}</div>} />
            <DetailRow label="Contacto" value={<div className="flex items-center gap-1.5"><Mail size={14} className="text-gray-400" />{publisher.contact}</div>} />
            <DetailRow label="Teléfono" value={publisher.phone} />
            <DetailRow label="Dirección" value={publisher.address} />
            <DetailRow label="Tipo de Contrato" value={<Badge variant="gold">{publisher.contractType}</Badge>} />
            <DetailRow label="Vencimiento" value={publisher.contractExpiry} />
            <DetailRow label="Productos asociados" value={<span className="font-bold text-corporate">{publisher.productCount}</span>} />
          </dl>
        </DetailSection>

        <DetailSection title="Contratos">
          <Table
            keyField="id"
            data={contracts}
            columns={[
              { key: 'name', header: 'Contrato', render: (c) => <span className="font-medium">{c.name}</span> },
              { key: 'startDate', header: 'Inicio', className: 'text-xs' },
              { key: 'endDate', header: 'Fin', className: 'text-xs' },
              { key: 'status', header: 'Estado', render: () => <Badge variant="success">Vigente</Badge> },
            ]}
          />
        </DetailSection>
      </div>

      <DetailSection title="Productos Asociados" subtitle={`${products.length} productos en catálogo`}>
        <Table
          keyField="id"
          data={products}
          columns={[
            { key: 'code', header: 'Código', render: (p) => <span className="font-mono text-xs text-corporate">{p.code}</span> },
            { key: 'title', header: 'Título', render: (p) => <span className="font-medium">{p.title}</span> },
            { key: 'category', header: 'Categoría', render: (p) => <Badge variant="neutral">{p.category}</Badge> },
            { key: 'price', header: 'Precio', render: (p) => <span className="font-semibold text-corporate">RD${p.price}</span> },
          ]}
        />
      </DetailSection>
    </AdminDetailLayout>
  )
}

export function PublisherDeletePage() {
  const { id } = useParams()
  const publisher = getPublisherById(id!)
  if (!publisher) return <RecordNotFound moduleLabel="editorial" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={publisher.name}
      recordSubtitle={publisher.country}
      recordSummary={[
        { label: 'Contacto', value: publisher.contact },
        { label: 'Productos', value: String(publisher.productCount) },
        { label: 'Contrato', value: publisher.contractType },
        { label: 'Estado', value: publisher.status === 'active' ? 'Activo' : 'Inactivo' },
      ]}
    />
  )
}
