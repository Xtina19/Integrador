import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { validateAdminCurrency } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { monedasApi, type MonedaDto } from '@/services/api/monedasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES.monedas
const statusOptions = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
]

export function CurrencyFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [existing, setExisting] = useState<MonedaDto | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [allCodes, setAllCodes] = useState<string[]>([])
  const [form, setForm] = useState({
    code: '',
    name: '',
    symbol: '',
    status: 'active',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await monedasApi.list()
        if (cancelled) return
        setAllCodes(list.map((c) => c.code))
        if (isEdit && id) {
          const found = list.find((c) => c.id === id) ?? (await monedasApi.getById(id))
          if (cancelled) return
          setExisting(found)
          setForm({
            code: found.code,
            name: found.name,
            symbol: found.symbol,
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
    () => validateAdminCurrency(form, allCodes, existing?.code),
    [form, allCodes, existing]
  )

  const empty = { code: '', name: '', symbol: '', status: 'active' }

  if (isEdit && !loading && (notFound || !existing)) {
    return <RecordNotFound moduleLabel="moneda" listPath={config.basePath} />
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando moneda…</p>
  }

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        const payload = {
          code: trim(form.code),
          name: trim(form.name),
          symbol: trim(form.symbol),
          status: form.status as 'active' | 'inactive',
        }
        if (isEdit && id) {
          await monedasApi.update(id, payload)
          showSuccess('Moneda actualizada')
        } else {
          await monedasApi.create(payload)
          showSuccess('Moneda creada')
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
        await monedasApi.create({
          code: trim(form.code),
          name: trim(form.name),
          symbol: trim(form.symbol),
          status: form.status as 'active' | 'inactive',
        })
        showSuccess('Moneda creada')
        setForm(empty)
        const list = await monedasApi.list()
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
      subtitle={isEdit ? `Modificando ${existing!.code}` : 'Nueva moneda del sistema'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Input
          label="Código ISO *"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="DOP"
          maxLength={3}
        />
        <Input
          label="Símbolo *"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          placeholder="RD$"
        />
        <Input
          label="Nombre *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Peso Dominicano"
          className="md:col-span-2"
        />
        <Select
          label="Estado"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          options={statusOptions}
        />
      </div>
    </AdminFormLayout>
  )
}

export function CurrencyDetailPage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [currency, setCurrency] = useState<MonedaDto | null>(null)
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
        const row = await monedasApi.getById(id)
        if (!cancelled) setCurrency(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando moneda…</p>
  if (notFound || !currency) {
    return <RecordNotFound moduleLabel="moneda" listPath={config.basePath} />
  }

  async function toggleEstado() {
    if (!currency) return
    const next = currency.status === 'active' ? 'inactive' : 'active'
    try {
      const updated = await monedasApi.setEstado(currency.id, next)
      setCurrency(updated)
      showSuccess(next === 'active' ? 'Moneda activada' : 'Moneda desactivada')
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <AdminDetailLayout
      config={config}
      id={currency.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={currency.name}
      subtitle={currency.code}
      statusBadge={
        <Badge variant={currency.status === 'active' ? 'success' : 'neutral'}>
          {currency.status === 'active' ? 'Activa' : 'Inactiva'}
        </Badge>
      }
    >
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => void toggleEstado()}>
          {currency.status === 'active' ? 'Desactivar' : 'Activar'}
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="Código" value={<Badge variant="gold">{currency.code}</Badge>} />
            <DetailRow label="Nombre" value={currency.name} />
            <DetailRow
              label="Símbolo"
              value={<span className="text-2xl font-bold text-corporate">{currency.symbol}</span>}
            />
            <DetailRow label="Moneda predeterminada" value={currency.isDefault ? 'Sí' : 'No'} />
            <DetailRow
              label="Estado"
              value={
                <Badge variant={currency.status === 'active' ? 'success' : 'neutral'}>
                  {currency.status === 'active' ? 'Activa' : 'Inactiva'}
                </Badge>
              }
            />
          </dl>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function CurrencyDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [currency, setCurrency] = useState<MonedaDto | null>(null)
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
        const row = await monedasApi.getById(id)
        if (!cancelled) setCurrency(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando moneda…</p>
  if (notFound || !currency) {
    return <RecordNotFound moduleLabel="moneda" listPath={config.basePath} />
  }

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={currency.name}
      recordSubtitle={currency.code}
      recordSummary={[
        { label: 'Símbolo', value: currency.symbol },
        { label: 'Predeterminada', value: currency.isDefault ? 'Sí' : 'No' },
        { label: 'Estado', value: currency.status === 'active' ? 'Activa' : 'Inactiva' },
      ]}
      onConfirm={async () => {
        try {
          await monedasApi.remove(currency.id)
          showSuccess('Moneda eliminada')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}
