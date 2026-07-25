import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { validateAdminCategory } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { categoriasApi } from '@/services/api/categoriasApi'
import { ensureCode } from '@/services/api/httpList'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES.categorias
const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

type Category = {
  id: string
  code: string
  name: string
  description: string
  status: string
  productCount: number
}

export function CategoryFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [existing, setExisting] = useState<Category | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [allNames, setAllNames] = useState<string[]>([])
  const [allCodes, setAllCodes] = useState<string[]>([])
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'active' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = (await categoriasApi.list()) as Category[]
        if (cancelled) return
        setAllNames(list.map((c) => c.name))
        setAllCodes(list.map((c) => c.code))
        if (isEdit && id) {
          const found = list.find((c) => c.id === id) ?? ((await categoriasApi.getById(id)) as Category)
          if (cancelled) return
          setExisting(found)
          setForm({
            code: found.code || '',
            name: found.name,
            description: found.description || '',
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
    () => validateAdminCategory(form, allNames, existing?.name),
    [form, allNames, existing]
  )

  const empty = { code: '', name: '', description: '', status: 'active' }

  if (isEdit && !loading && (notFound || !existing)) {
    return <RecordNotFound moduleLabel="categoría" listPath={config.basePath} />
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando categoría…</p>
  }

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        const code = ensureCode('CAT', trim(form.name), trim(form.code) || existing?.code, allCodes)
        const payload = {
          code,
          name: trim(form.name),
          description: trim(form.description),
          status: form.status,
        }
        if (isEdit && id) {
          await categoriasApi.update(id, payload)
          showSuccess('Categoría actualizada')
        } else {
          await categoriasApi.create(payload)
          showSuccess('Categoría creada')
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
        const code = ensureCode('CAT', trim(form.name), trim(form.code), allCodes)
        await categoriasApi.create({
          code,
          name: trim(form.name),
          description: trim(form.description),
          status: form.status,
        })
        showSuccess('Categoría creada')
        setForm(empty)
        const list = (await categoriasApi.list()) as Category[]
        setAllNames(list.map((c) => c.name))
        setAllCodes(list.map((c) => c.code))
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
      subtitle={isEdit ? `Modificando ${existing!.name}` : 'Nueva clasificación de productos'}
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
      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        <Input label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Se genera automáticamente si se deja vacío" />
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Literatura" />
        <Textarea label="Descripción *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Descripción de la categoría..." />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
      </div>
    </AdminFormLayout>
  )
}

export function CategoryDetailPage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [category, setCategory] = useState<Category | null>(null)
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
        const row = (await categoriasApi.getById(id)) as Category
        if (!cancelled) setCategory(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando categoría…</p>
  if (notFound || !category) {
    return <RecordNotFound moduleLabel="categoría" listPath={config.basePath} />
  }

  async function toggleEstado() {
    if (!category) return
    const next = category.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = (await categoriasApi.setEstado(category.id, next)) as Category
      setCategory(updated)
      showSuccess(next === 'active' ? 'Categoría activada' : 'Categoría desactivada')
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <AdminDetailLayout
      config={config}
      id={category.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={category.name}
      subtitle={category.code}
      statusBadge={<Badge variant={category.status === 'active' ? 'success' : 'neutral'}>{category.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>}
    >
      <div className="flex justify-end mb-4">
        <button type="button" className="text-sm font-medium text-corporate hover:underline" onClick={() => void toggleEstado()}>
          {category.status === 'active' ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="Código" value={<Badge variant="gold">{category.code}</Badge>} />
            <DetailRow label="Nombre" value={category.name} />
            <DetailRow label="Descripción" value={category.description} />
            <DetailRow label="Estado" value={<Badge variant={category.status === 'active' ? 'success' : 'neutral'}>{category.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>} />
            <DetailRow label="Productos asociados" value={<span className="font-bold text-corporate">{category.productCount.toLocaleString()}</span>} />
          </dl>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function CategoryDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [category, setCategory] = useState<Category | null>(null)
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
        const row = (await categoriasApi.getById(id)) as Category
        if (!cancelled) setCategory(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando categoría…</p>
  if (notFound || !category) {
    return <RecordNotFound moduleLabel="categoría" listPath={config.basePath} />
  }

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={category.name}
      recordSubtitle={category.code}
      recordSummary={[
        { label: 'Productos asociados', value: category.productCount.toLocaleString() },
        { label: 'Estado', value: category.status === 'active' ? 'Activo' : 'Inactivo' },
        { label: 'Descripción', value: category.description },
      ]}
      onConfirm={async () => {
        try {
          await categoriasApi.setEstado(category.id, 'inactive')
          showSuccess('Categoría desactivada')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}
