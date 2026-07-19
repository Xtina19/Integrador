import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { validateAdminSupplier } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { proveedoresApi } from '@/services/api/proveedoresApi'
import { ensureCode } from '@/services/api/httpList'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES.proveedores
const supplierTypes = ['Distribuidor', 'Editorial', 'Logística', 'Material de oficina', 'Tecnología']

type Supplier = {
  id: string
  code: string
  name: string
  contact: string
  email: string
  phone: string
  country: string
  supplierType: string
  status: string
  purchasesCount: number
}

function tipoFromSupplierType(supplierType: string) {
  return supplierType === 'Editorial' ? 'internacional' : 'nacional'
}

export function SupplierFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [existing, setExisting] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [allCodes, setAllCodes] = useState<string[]>([])
  const [allNames, setAllNames] = useState<string[]>([])
  const [form, setForm] = useState({
    code: '',
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    supplierType: supplierTypes[0],
    country: 'República Dominicana',
    status: 'active',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = (await proveedoresApi.list()) as Supplier[]
        if (cancelled) return
        setAllCodes(list.map((s) => s.code))
        setAllNames(list.map((s) => s.name))
        if (isEdit && id) {
          const found = list.find((s) => s.id === id) ?? ((await proveedoresApi.getById(id)) as Supplier)
          if (cancelled) return
          setExisting(found)
          setForm({
            code: found.code,
            name: found.name,
            contact: found.contact,
            email: found.email,
            phone: found.phone,
            address: '',
            supplierType: found.supplierType || supplierTypes[0],
            country: found.country || 'República Dominicana',
            status: found.status,
          })
        }
      } catch {
        if (isEdit) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const validation = useMemo(
    () =>
      validateAdminSupplier(
        {
          name: form.name,
          code: form.code || existing?.code || '',
          type: form.supplierType,
          country: form.country,
          contact: form.contact,
          phone: form.phone,
          email: form.email,
        },
        allCodes,
        allNames,
        existing?.code,
        existing?.name
      ),
    [form, allCodes, allNames, existing]
  )

  const empty = { code: '', name: '', contact: '', email: '', phone: '', address: '', supplierType: supplierTypes[0], country: 'República Dominicana', status: 'active' }

  if (isEdit && !loading && (notFound || !existing)) {
    return <RecordNotFound moduleLabel="proveedor" listPath={config.basePath} />
  }

  if (isEdit && loading) {
    return <p className="text-sm text-gray-500">Cargando proveedor…</p>
  }

  const buildPayload = () => ({
    code: ensureCode('PROV', trim(form.name), trim(form.code) || existing?.code, allCodes),
    name: trim(form.name),
    contact: trim(form.contact),
    email: trim(form.email),
    phone: trim(form.phone),
    country: trim(form.country),
    tipo: tipoFromSupplierType(form.supplierType),
    status: form.status,
  })

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        const payload = buildPayload()
        if (isEdit && id) {
          await proveedoresApi.update(id, payload)
          showSuccess('Proveedor actualizado')
        } else {
          await proveedoresApi.create(payload)
          showSuccess('Proveedor creado')
        }
        navigate(config.basePath)
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
    return false
  }

  const saveContinue = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        await proveedoresApi.create(buildPayload())
        showSuccess('Proveedor creado')
        setForm(empty)
        const list = (await proveedoresApi.list()) as Supplier[]
        setAllCodes(list.map((s) => s.code))
        setAllNames(list.map((s) => s.name))
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
    return false
  }

  return (
    <AdminFormLayout
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: isEdit ? config.editTitle : config.createTitle }]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nuevo proveedor comercial'}
      listPath={config.basePath}
      saveDisabled={!validation.valid}
      onSave={saveForm}
      onSaveContinue={!isEdit ? saveContinue : undefined}
    >
      {!validation.valid && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
          {validation.errors[0]}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Se genera si se deja vacío" />
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
        <Input label="Contacto *" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <Input label="Correo *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Teléfono *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="País *" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <Select label="Tipo de Proveedor *" value={form.supplierType} onChange={(e) => setForm({ ...form, supplierType: e.target.value })} options={supplierTypes.map((t) => ({ value: t, label: t }))} />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={[{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]} />
      </div>
    </AdminFormLayout>
  )
}

export function SupplierDetailPage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }
      try {
        const row = (await proveedoresApi.getById(id)) as Supplier
        if (!cancelled) setSupplier(row)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-sm text-gray-500">Cargando proveedor…</p>
  if (notFound || !supplier) return <RecordNotFound moduleLabel="proveedor" listPath={config.basePath} />

  async function toggleEstado() {
    if (!supplier) return
    const next = supplier.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = (await proveedoresApi.setEstado(supplier.id, next)) as Supplier
      setSupplier(updated)
      showSuccess(next === 'active' ? 'Proveedor activado' : 'Proveedor desactivado')
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <AdminDetailLayout
      config={config}
      id={supplier.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={supplier.name}
      subtitle={supplier.code}
      statusBadge={<Badge variant={supplier.status === 'active' ? 'success' : 'neutral'}>{supplier.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>}
    >
      <div className="flex justify-end mb-4">
        <button type="button" className="text-sm font-medium text-corporate hover:underline" onClick={() => void toggleEstado()}>
          {supplier.status === 'active' ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información de Contacto">
          <dl>
            <DetailRow label="Código" value={<Badge variant="gold">{supplier.code}</Badge>} />
            <DetailRow label="Contacto" value={supplier.contact} />
            <DetailRow label="Correo" value={supplier.email} />
            <DetailRow label="Teléfono" value={supplier.phone} />
            <DetailRow label="País" value={supplier.country || '—'} />
            <DetailRow label="Tipo" value={<Badge variant="gold">{supplier.supplierType}</Badge>} />
          </dl>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function SupplierDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!id) {
        setNotFound(true)
        setLoading(false)
        return
      }
      try {
        const row = (await proveedoresApi.getById(id)) as Supplier
        if (!cancelled) setSupplier(row)
      } catch {
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="text-sm text-gray-500">Cargando proveedor…</p>
  if (notFound || !supplier) return <RecordNotFound moduleLabel="proveedor" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={supplier.name}
      recordSubtitle={supplier.code}
      recordSummary={[
        { label: 'Contacto', value: supplier.contact },
        { label: 'Correo', value: supplier.email },
        { label: 'Teléfono', value: supplier.phone },
        { label: 'Tipo', value: supplier.supplierType },
      ]}
      onConfirm={async () => {
        try {
          await proveedoresApi.setEstado(supplier.id, 'inactive')
          showSuccess('Proveedor desactivado')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}
