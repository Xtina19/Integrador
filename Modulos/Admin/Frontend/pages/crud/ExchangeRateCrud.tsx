import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminFormLayout } from '@/modules/admin/components/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '@/modules/admin/components/AdminDetailLayout'
import { DetailSection, DetailRow } from '@/modules/admin/components/AdminDetailSection'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { RecordNotFound } from '@/modules/admin/components/RecordNotFound'
import { ADMIN_MODULES } from '@/lib/adminConfig'
import { validateAdminExchangeRate } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { tasasCambioApi } from '@/services/api/tasasCambioApi'
import { monedasApi } from '@/services/api/monedasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const config = ADMIN_MODULES['tasas-cambio']

type ExchangeRate = {
  id: string
  fromCurrency: string
  toCurrency: string
  value: number
  date: string
  updatedBy: string
  notes: string
  status: string
}

export function ExchangeRateFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [existing, setExisting] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [notFound, setNotFound] = useState(false)
  const [currencyCodes, setCurrencyCodes] = useState<string[]>(['DOP', 'USD'])
  const [form, setForm] = useState({
    fromCurrency: 'USD',
    toCurrency: 'DOP',
    value: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const monedas = await monedasApi.list()
        if (!cancelled) setCurrencyCodes(monedas.map((m) => m.code))
        if (isEdit && id) {
          const found = (await tasasCambioApi.getById(id)) as ExchangeRate
          if (cancelled) return
          setExisting(found)
          setForm({
            fromCurrency: found.fromCurrency,
            toCurrency: found.toCurrency,
            value: String(found.value),
            date: found.date,
            notes: found.notes || '',
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

  const currencyOptions = currencyCodes.map((c) => ({ value: c, label: c }))
  const empty = { fromCurrency: 'USD', toCurrency: 'DOP', value: '', date: new Date().toISOString().slice(0, 10), notes: '' }

  const validation = useMemo(
    () =>
      validateAdminExchangeRate({
        fromCurrency: form.fromCurrency,
        toCurrency: form.toCurrency,
        rate: form.value,
        date: form.date,
      }),
    [form]
  )

  if (isEdit && !loading && (notFound || !existing)) {
    return <RecordNotFound moduleLabel="tasa de cambio" listPath={config.basePath} />
  }

  if (isEdit && loading) {
    return <p className="text-sm text-gray-500">Cargando tasa…</p>
  }

  const buildPayload = () => ({
    fromCurrency: form.fromCurrency,
    toCurrency: form.toCurrency,
    value: Number(form.value) || 0,
    date: trim(form.date),
    notes: trim(form.notes),
  })

  const saveForm = () => {
    if (!validation.valid) return false
    void (async () => {
      try {
        const payload = buildPayload()
        if (isEdit && id) {
          await tasasCambioApi.update(id, payload)
          showSuccess('Tasa de cambio actualizada')
        } else {
          await tasasCambioApi.create(payload)
          showSuccess('Tasa de cambio creada')
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
        await tasasCambioApi.create(buildPayload())
        showSuccess('Tasa de cambio creada')
        setForm(empty)
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
      subtitle={isEdit ? `Modificando ${existing!.fromCurrency}/${existing!.toCurrency}` : 'Nueva tasa de conversión'}
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
        <Select label="Moneda Origen *" value={form.fromCurrency} onChange={(e) => setForm({ ...form, fromCurrency: e.target.value })} options={currencyOptions} />
        <Select label="Moneda Destino *" value={form.toCurrency} onChange={(e) => setForm({ ...form, toCurrency: e.target.value })} options={currencyOptions} />
        <Input label="Valor *" type="number" step="0.0001" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0.0000" />
        <Input label="Fecha *" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Referencia o fuente de la tasa..." className="md:col-span-2" rows={3} />
      </div>
    </AdminFormLayout>
  )
}

export function ExchangeRateDetailPage() {
  const { id } = useParams()
  const [rate, setRate] = useState<ExchangeRate | null>(null)
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
        const row = (await tasasCambioApi.getById(id)) as ExchangeRate
        if (!cancelled) setRate(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando tasa…</p>
  if (notFound || !rate) return <RecordNotFound moduleLabel="tasa de cambio" listPath={config.basePath} />

  return (
    <AdminDetailLayout
      config={config}
      id={rate.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={`${rate.fromCurrency} → ${rate.toCurrency}`}
      subtitle={`Tasa vigente: ${rate.value.toFixed(4)}`}
      showDelete={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información de la Tasa">
          <dl>
            <DetailRow label="Moneda Origen" value={<Badge variant="gold">{rate.fromCurrency}</Badge>} />
            <DetailRow label="Moneda Destino" value={<Badge variant="neutral">{rate.toCurrency}</Badge>} />
            <DetailRow label="Valor" value={<span className="text-2xl font-bold text-corporate">{rate.value.toFixed(4)}</span>} />
            <DetailRow label="Fecha" value={rate.date} />
            <DetailRow label="Actualizado por" value={rate.updatedBy || '—'} />
            <DetailRow label="Estado" value={<Badge variant={rate.status === 'active' ? 'success' : 'neutral'}>{rate.status === 'active' ? 'Activa' : 'Inactiva'}</Badge>} />
          </dl>
        </DetailSection>

        <DetailSection title="Conversión de Ejemplo">
          <div className="text-center py-6 px-4 rounded-lg bg-surface">
            <p className="text-sm text-gray-500">1 {rate.fromCurrency} equivale a</p>
            <p className="text-3xl font-bold text-corporate mt-2">{rate.value.toFixed(4)} {rate.toCurrency}</p>
          </div>
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function ExchangeRateDeletePage() {
  const { id } = useParams()
  const { showSuccess, showError } = useToast()
  const [rate, setRate] = useState<ExchangeRate | null>(null)
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
        const row = (await tasasCambioApi.getById(id)) as ExchangeRate
        if (!cancelled) setRate(row)
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

  if (loading) return <p className="text-sm text-gray-500">Cargando tasa…</p>
  if (notFound || !rate) return <RecordNotFound moduleLabel="tasa de cambio" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={`${rate.fromCurrency} → ${rate.toCurrency}`}
      recordSubtitle={`Valor: ${rate.value.toFixed(4)}`}
      recordSummary={[
        { label: 'Fecha', value: rate.date },
        { label: 'Actualizado por', value: rate.updatedBy || '—' },
        { label: 'Estado', value: rate.status === 'active' ? 'Activa' : 'Inactiva' },
      ]}
      onConfirm={async () => {
        try {
          await tasasCambioApi.setEstado(rate.id, 'inactive')
          showSuccess('Tasa desactivada')
          return true
        } catch (err) {
          showError(getFriendlyErrorMessage(err))
          return false
        }
      }}
    />
  )
}
