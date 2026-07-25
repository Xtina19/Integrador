import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { trim } from '@/utils/formValidation'
import { almacenesApi } from '@/services/api/almacenesApi'
import { ensureCode } from '@/services/api/httpList'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES.sucursales
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const typeOptions = [
  { value: 'central', label: 'Central' },
  { value: 'sucursal', label: 'Sucursal' },
  { value: 'transito', label: 'Tránsito' },
  { value: 'evento', label: 'Evento' },
]

const typeLabels: Record<string, string> = {
  central: 'Central',
  sucursal: 'Sucursal',
  transito: 'Tránsito',
  evento: 'Evento',
}

type Almacen = {
  id: string
  code: string
  name: string
  type: string
  status: string
}

export function BranchFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [existing, setExisting] = useState<Almacen | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [allCodes, setAllCodes] = useState<string[]>([])
  const [form, setForm] = useState({ code: '', name: '', type: 'sucursal', status: 'active' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = (await almacenesApi.list()) as Almacen[]
        if (cancelled) return
        setAllCodes(list.map((b) => b.code))
        if (isEdit && id) {
          const found = list.find((b) => b.id === id) ?? ((await almacenesApi.getById(id)) as Almacen)
          if (cancelled) return
          setExisting(found)
          setForm({
            code: found.code,
            name: found.name,
            type: found.type || 'sucursal',
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

  const validation = useMemo(() => {
    if (!trim(form.name)) return { valid: false, errors: ['Nombre es obligatorio'] }
    return { valid: true, errors: [] as string[] }
  }, [form.name])

  const empty = { code: '', name: '', type: 'sucursal', status: 'active' }

  if (isEdit && !loading && (notFound || !existing)) {
    return <RecordNotFound moduleLabel="almacén" listPath={config.basePath} />
  }

  if (isEdit && loading) {
    return <p className="text-sm text-gray-500">Cargando almacén…</p>
  }

  const buildPayload = () => ({
    code: ensureCode('ALM', trim(form.name), trim(form.code) || existing?.code, allCodes),
    name: trim(form.name),
    type: form.type,
    status: form.status,
  })

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        const payload = buildPayload()
        if (isEdit && id) {
          await almacenesApi.update(id, payload)
          showSuccess('Almacén actualizado')
        } else {
          await almacenesApi.create(payload)
          showSuccess('Almacén creado')
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
        await almacenesApi.create(buildPayload())
        showSuccess('Almacén creado')
        setForm(empty)
        const list = (await almacenesApi.list()) as Almacen[]
        setAllCodes(list.map((b) => b.code))
      } catch (err) {
        showError(getFriendlyErrorMessage(err))
      }
    })()
    return false
  }

  return (
    <AdminFormLayout
      breadcrumbs={[
        { label: 'Almacenes', to: config.basePath },
        { label: isEdit ? 'Editar Almacén' : 'Registrar Almacén' },
      ]}
      title={isEdit ? 'Editar Almacén' : 'Registrar Almacén'}
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nueva ubicación de inventario'}
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
        <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={typeOptions} />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
      </div>
    </AdminFormLayout>
  )
}

export function BranchDetailPage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [branch, setBranch] = useState<Almacen | null>(null)
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
        const row = (await almacenesApi.getById(id)) as Almacen
        if (!cancelled) setBranch(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando almacén…</p>
  if (notFound || !branch) return <RecordNotFound moduleLabel="almacén" listPath={config.basePath} />

  async function toggleEstado() {
    if (!branch) return
    const next = branch.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = (await almacenesApi.setEstado(branch.id, next)) as Almacen
      setBranch(updated)
      showSuccess(next === 'active' ? 'Almacén activado' : 'Almacén desactivado')
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <AdminDetailLayout
      config={config}
      id={branch.id}
      breadcrumbs={[{ label: 'Almacenes', to: config.basePath }, { label: 'Detalle de Almacén' }]}
      title={branch.name}
      subtitle={branch.code}
      statusBadge={<Badge variant={branch.status === 'active' ? 'success' : 'neutral'}>{branch.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>}
    >
      <div className="flex justify-end mb-4">
        <button type="button" className="text-sm font-medium text-corporate hover:underline" onClick={() => void toggleEstado()}>
          {branch.status === 'active' ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="Código" value={<Badge variant="gold">{branch.code}</Badge>} />
            <DetailRow label="Nombre" value={branch.name} />
            <DetailRow label="Tipo" value={<Badge variant="neutral">{typeLabels[branch.type] || branch.type}</Badge>} />
            <DetailRow label="Estado" value={<Badge variant={branch.status === 'active' ? 'success' : 'neutral'}>{branch.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>} />
          </dl>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function BranchDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [branch, setBranch] = useState<Almacen | null>(null)
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
        const row = (await almacenesApi.getById(id)) as Almacen
        if (!cancelled) setBranch(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando almacén…</p>
  if (notFound || !branch) return <RecordNotFound moduleLabel="almacén" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: 'Almacenes', to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={branch.name}
      recordSubtitle={branch.code}
      recordSummary={[
        { label: 'Tipo', value: typeLabels[branch.type] || branch.type },
        { label: 'Estado', value: branch.status === 'active' ? 'Activo' : 'Inactivo' },
      ]}
      onConfirm={async () => {
        try {
          await almacenesApi.setEstado(branch.id, 'inactive')
          showSuccess('Almacén desactivado')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}
