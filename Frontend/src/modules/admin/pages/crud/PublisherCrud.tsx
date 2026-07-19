import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Globe, Mail } from 'lucide-react'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { contractStatusConfig, getContractVisualStatus } from '@/lib/publisherContractStatus'
import { validateAdminPublisher } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { editorialesApi } from '@/services/api/editorialesApi'
import { ensureCode } from '@/services/api/httpList'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

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

type Publisher = {
  id: string
  code: string
  name: string
  country: string
  contact: string
  phone: string
  address: string
  contractType: string
  contractExpiry: string
  status: string
  productCount: number
}

export function PublisherFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [existing, setExisting] = useState<Publisher | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [allNames, setAllNames] = useState<string[]>([])
  const [allCodes, setAllCodes] = useState<string[]>([])
  const [form, setForm] = useState({
    code: '',
    name: '',
    country: '',
    contact: '',
    phone: '',
    address: '',
    contractType: contractTypes[0],
    contractExpiry: '',
    status: 'active',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = (await editorialesApi.list()) as Publisher[]
        if (cancelled) return
        setAllNames(list.map((p) => p.name))
        setAllCodes(list.map((p) => p.code))
        if (isEdit && id) {
          const found = list.find((p) => p.id === id) ?? ((await editorialesApi.getById(id)) as Publisher)
          if (cancelled) return
          setExisting(found)
          setForm({
            code: found.code,
            name: found.name,
            country: found.country,
            contact: found.contact,
            phone: found.phone,
            address: found.address || '',
            contractType: found.contractType || contractTypes[0],
            contractExpiry: found.contractExpiry,
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
    () => validateAdminPublisher({ ...form, address: form.address || 'Sin dirección registrada' }, allNames, existing?.name),
    [form, allNames, existing]
  )

  const empty = { code: '', name: '', country: '', contact: '', phone: '', address: '', contractType: contractTypes[0], contractExpiry: '', status: 'active' }

  if (isEdit && !loading && (notFound || !existing)) {
    return <RecordNotFound moduleLabel="editorial" listPath={config.basePath} />
  }

  if (isEdit && loading) {
    return <p className="text-sm text-gray-500">Cargando editorial…</p>
  }

  const buildPayload = () => ({
    code: ensureCode('ED', trim(form.name), trim(form.code) || existing?.code, allCodes),
    name: trim(form.name),
    country: trim(form.country),
    contact: trim(form.contact),
    phone: trim(form.phone),
    contractType: form.contractType,
    contractExpiry: form.contractExpiry || null,
    status: form.status,
  })

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        const payload = buildPayload()
        if (isEdit && id) {
          await editorialesApi.update(id, payload)
          showSuccess('Editorial actualizada')
        } else {
          await editorialesApi.create(payload)
          showSuccess('Editorial creada')
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
        await editorialesApi.create(buildPayload())
        showSuccess('Editorial creada')
        setForm(empty)
        const list = (await editorialesApi.list()) as Publisher[]
        setAllNames(list.map((p) => p.name))
        setAllCodes(list.map((p) => p.code))
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
    return false
  }

  return (
    <AdminFormLayout
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: isEdit ? config.editTitle : config.createTitle },
      ]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nueva editorial en catálogo maestro'}
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
        <Input label="País *" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <Input label="Contacto *" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" placeholder="Opcional" />
        <Select label="Tipo de Contrato *" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} options={contractTypes.map((t) => ({ value: t, label: t }))} />
        <Input label="Vencimiento contrato" type="date" value={form.contractExpiry} onChange={(e) => setForm({ ...form, contractExpiry: e.target.value })} />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
      </div>
    </AdminFormLayout>
  )
}

export function PublisherDetailPage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [publisher, setPublisher] = useState<Publisher | null>(null)
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
        const row = (await editorialesApi.getById(id)) as Publisher
        if (!cancelled) setPublisher(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando editorial…</p>
  if (notFound || !publisher) return <RecordNotFound moduleLabel="editorial" listPath={config.basePath} />

  const contractStatus = getContractVisualStatus(publisher.contractExpiry)
  const contractBadge = contractStatusConfig[contractStatus]

  async function toggleEstado() {
    if (!publisher) return
    const next = publisher.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = (await editorialesApi.setEstado(publisher.id, next)) as Publisher
      setPublisher(updated)
      showSuccess(next === 'active' ? 'Editorial activada' : 'Editorial desactivada')
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <AdminDetailLayout
      config={config}
      id={publisher.id}
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: config.detailTitle },
      ]}
      title={publisher.name}
      subtitle={publisher.code}
      statusBadge={<Badge variant={publisher.status === 'active' ? 'success' : 'neutral'}>{publisher.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>}
    >
      <div className="flex justify-end mb-4">
        <button type="button" className="text-sm font-medium text-corporate hover:underline" onClick={() => void toggleEstado()}>
          {publisher.status === 'active' ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Datos Generales">
          <dl>
            <DetailRow label="Código" value={<Badge variant="gold">{publisher.code}</Badge>} />
            <DetailRow label="País" value={<div className="flex items-center gap-1.5"><Globe size={14} className="text-gray-400" />{publisher.country}</div>} />
            <DetailRow label="Contacto" value={<div className="flex items-center gap-1.5"><Mail size={14} className="text-gray-400" />{publisher.contact}</div>} />
            <DetailRow label="Teléfono" value={publisher.phone} />
            <DetailRow label="Tipo de Contrato" value={<Badge variant="gold">{publisher.contractType}</Badge>} />
            <DetailRow label="Vencimiento" value={publisher.contractExpiry || '—'} />
            <DetailRow label="Estado del contrato" value={<Badge variant={contractBadge.variant}>{contractBadge.label}</Badge>} />
            <DetailRow label="Productos asociados" value={<span className="font-bold text-corporate">{publisher.productCount}</span>} />
          </dl>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function PublisherDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [publisher, setPublisher] = useState<Publisher | null>(null)
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
        const row = (await editorialesApi.getById(id)) as Publisher
        if (!cancelled) setPublisher(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando editorial…</p>
  if (notFound || !publisher) return <RecordNotFound moduleLabel="editorial" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[
        { label: config.label, to: config.basePath },
        { label: config.deleteTitle },
      ]}
      recordTitle={publisher.name}
      recordSubtitle={publisher.code}
      recordSummary={[
        { label: 'Contacto', value: publisher.contact },
        { label: 'Productos', value: String(publisher.productCount) },
        { label: 'Contrato', value: publisher.contractType },
        { label: 'Estado', value: publisher.status === 'active' ? 'Activo' : 'Inactivo' },
      ]}
      onConfirm={async () => {
        try {
          await editorialesApi.setEstado(publisher.id, 'inactive')
          showSuccess('Editorial desactivada')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}
