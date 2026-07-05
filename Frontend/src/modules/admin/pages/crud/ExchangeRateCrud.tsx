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
import { getExchangeRateById, getRateHistory, currencyCodes } from '@/mocks/mockAdmin'
import { validateAdminExchangeRate } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'

const config = ADMIN_MODULES['tasas-cambio']

export function ExchangeRateFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = isEdit ? getExchangeRateById(id!) : null

  if (isEdit && !existing) return <RecordNotFound moduleLabel="tasa de cambio" listPath={config.basePath} />

  const [form, setForm] = useState({
    fromCurrency: existing?.fromCurrency ?? 'USD',
    toCurrency: existing?.toCurrency ?? 'DOP',
    value: existing ? String(existing.value) : '',
    date: existing?.date ?? new Date().toISOString().slice(0, 10),
    notes: existing?.notes ?? '',
  })

  const empty = { fromCurrency: 'USD', toCurrency: 'DOP', value: '', date: new Date().toISOString().slice(0, 10), notes: '' }
  const currencyOptions = currencyCodes.map((c) => ({ value: c, label: c }))

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

  const saveForm = () => {
    if (!validation.valid) return false
    setForm((f) => ({ ...f, date: trim(f.date), notes: trim(f.notes) }))
    return true
  }

  return (
    <AdminFormLayout
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: isEdit ? config.editTitle : config.createTitle }]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.fromCurrency}/${existing!.toCurrency}` : 'Nueva tasa de conversión'}
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
  const rate = getExchangeRateById(id!)
  if (!rate) return <RecordNotFound moduleLabel="tasa de cambio" listPath={config.basePath} />

  const history = getRateHistory(rate.id)

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
            <DetailRow label="Actualizado por" value={rate.updatedBy} />
            <DetailRow label="Notas" value={rate.notes || '—'} />
          </dl>
        </DetailSection>

        <DetailSection title="Conversión de Ejemplo">
          <div className="text-center py-6 px-4 rounded-lg bg-surface">
            <p className="text-sm text-gray-500">1 {rate.fromCurrency} equivale a</p>
            <p className="text-3xl font-bold text-corporate mt-2">{rate.value.toFixed(4)} {rate.toCurrency}</p>
          </div>
        </DetailSection>
      </div>

      <DetailSection title="Historial de Cambios">
        <Table
          keyField="id"
          data={history}
          columns={[
            { key: 'date', header: 'Fecha/Hora', className: 'text-xs text-gray-500 whitespace-nowrap' },
            { key: 'value', header: 'Valor', render: (h) => <span className="font-semibold text-corporate">{h.value.toFixed(4)}</span> },
            { key: 'updatedBy', header: 'Usuario' },
          ]}
        />
      </DetailSection>
    </AdminDetailLayout>
  )
}

export function ExchangeRateDeletePage() {
  const { id } = useParams()
  const rate = getExchangeRateById(id!)
  if (!rate) return <RecordNotFound moduleLabel="tasa de cambio" listPath={config.basePath} />

  return (
    <AdminDeleteLayout
      config={config}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.deleteTitle }]}
      recordTitle={`${rate.fromCurrency} → ${rate.toCurrency}`}
      recordSubtitle={`Valor: ${rate.value.toFixed(4)}`}
      recordSummary={[
        { label: 'Fecha', value: rate.date },
        { label: 'Actualizado por', value: rate.updatedBy },
        { label: 'Notas', value: rate.notes || '—' },
      ]}
    />
  )
}
