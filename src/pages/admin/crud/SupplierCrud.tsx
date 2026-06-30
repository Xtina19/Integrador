import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminFormLayout } from '../../../components/admin/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '../../../components/admin/AdminDetailLayout'
import { DetailSection, DetailRow } from '../../../components/admin/AdminDetailSection'
import { Input, Select } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { Table } from '../../../components/ui/Table'
import { RecordNotFound } from '../../../components/admin/RecordNotFound'
import { ADMIN_MODULES } from '../../../lib/adminConfig'
import { getSupplierById, getSupplierPurchases, adminSuppliers } from '../../../data/adminMockData'
import { validateAdminSupplier } from '../../../business-rules/adminValidators'
import { trim } from '../../../utils/formValidation'

const config = ADMIN_MODULES.proveedores
const supplierTypes = ['Distribuidor', 'Editorial', 'Logística', 'Material de oficina', 'Tecnología']

export function SupplierFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = isEdit ? getSupplierById(id!) : null

  if (isEdit && !existing) return <RecordNotFound moduleLabel="proveedor" listPath={config.basePath} />

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    contact: existing?.contact ?? '',
    email: existing?.email ?? '',
    phone: existing?.phone ?? '',
    address: existing?.address ?? '',
    supplierType: existing?.supplierType ?? supplierTypes[0],
    status: 'active',
  })

  const empty = { name: '', contact: '', email: '', phone: '', address: '', supplierType: supplierTypes[0], status: 'active' }

  const validation = useMemo(
    () =>
      validateAdminSupplier(
        {
          name: form.name,
          code: existing?.id ?? trim(form.name).replace(/\s+/g, '-'),
          type: form.supplierType,
          country: existing && 'country' in existing ? (existing.country as string) : 'República Dominicana',
          contact: form.contact,
          phone: form.phone,
          email: form.email,
        },
        adminSuppliers.map((s) => s.id),
        adminSuppliers.map((s) => s.name),
        existing?.id,
        existing?.name
      ),
    [form, existing]
  )

  const saveForm = () => {
    if (!validation.valid) return false
    setForm((f) => ({
      ...f,
      name: trim(f.name),
      contact: trim(f.contact),
      email: trim(f.email),
      phone: trim(f.phone),
      address: trim(f.address),
    }))
    return true
  }

  return (
    <AdminFormLayout
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: isEdit ? config.editTitle : config.createTitle }]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nuevo proveedor comercial'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Input label="Contacto *" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <Input label="Correo *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Teléfono *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
        <Select label="Tipo de Proveedor *" value={form.supplierType} onChange={(e) => setForm({ ...form, supplierType: e.target.value })} options={supplierTypes.map((t) => ({ value: t, label: t }))} />
      </div>
    </AdminFormLayout>
  )
}

export function SupplierDetailPage() {
  const { id } = useParams()
  const supplier = getSupplierById(id!)
  if (!supplier) return <RecordNotFound moduleLabel="proveedor" listPath={config.basePath} />

  const purchases = getSupplierPurchases(supplier.id)

  return (
    <AdminDetailLayout
      config={config}
      id={supplier.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={supplier.name}
      subtitle={supplier.supplierType}
      statusBadge={<Badge variant="neutral">{supplier.supplierType}</Badge>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información de Contacto">
          <dl>
            <DetailRow label="Contacto" value={supplier.contact} />
            <DetailRow label="Correo" value={supplier.email} />
            <DetailRow label="Teléfono" value={supplier.phone} />
            <DetailRow label="Dirección" value={supplier.address} />
            <DetailRow label="Tipo" value={<Badge variant="gold">{supplier.supplierType}</Badge>} />
            <DetailRow label="Compras realizadas" value={<span className="text-xl font-bold text-corporate">{supplier.purchasesCount}</span>} />
          </dl>
        </DetailSection>

        <DetailSection title="Historial de Compras" subtitle="Órdenes recientes">
          <Table
            keyField="id"
            data={purchases}
            columns={[
              { key: 'id', header: 'Orden', render: (p) => <span className="font-mono text-xs text-corporate">{p.id}</span> },
              { key: 'date', header: 'Fecha', className: 'text-xs' },
              { key: 'amount', header: 'Monto', render: (p) => <span className="font-semibold">{p.amount}</span> },
              { key: 'status', header: 'Estado', render: () => <Badge variant="success">Completada</Badge> },
            ]}
          />
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function SupplierDeletePage() {
  const { id } = useParams()
  const supplier = getSupplierById(id!)
  if (!supplier) return <RecordNotFound moduleLabel="proveedor" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={supplier.name}
      recordSubtitle={supplier.supplierType}
      recordSummary={[
        { label: 'Contacto', value: supplier.contact },
        { label: 'Correo', value: supplier.email },
        { label: 'Compras', value: String(supplier.purchasesCount) },
        { label: 'Teléfono', value: supplier.phone },
      ]}
    />
  )
}
