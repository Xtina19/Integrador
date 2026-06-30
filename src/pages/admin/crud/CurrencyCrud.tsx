import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminFormLayout } from '../../../components/admin/AdminFormLayout'
import { AdminDetailLayout, AdminDeleteLayout } from '../../../components/admin/AdminDetailLayout'
import { DetailSection, DetailRow } from '../../../components/admin/AdminDetailSection'
import { Input, Select } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'
import { RecordNotFound } from '../../../components/admin/RecordNotFound'
import { ADMIN_MODULES } from '../../../lib/adminConfig'
import { getCurrencyById, adminExchangeRates, adminCurrencies } from '../../../data/adminMockData'
import { validateAdminCurrency } from '../../../business-rules/adminValidators'
import { trim } from '../../../utils/formValidation'

const config = ADMIN_MODULES.monedas
const statusOptions = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
]

export function CurrencyFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const existing = isEdit ? getCurrencyById(id!) : null

  if (isEdit && !existing) return <RecordNotFound moduleLabel="moneda" listPath={config.basePath} />

  const [form, setForm] = useState({
    code: existing?.code ?? '',
    name: existing?.name ?? '',
    symbol: existing?.symbol ?? '',
    decimalPlaces: String(existing?.decimalPlaces ?? 2),
    status: existing?.status ?? 'active',
  })

  const empty = { code: '', name: '', symbol: '', decimalPlaces: '2', status: 'active' }

  const validation = useMemo(
    () => validateAdminCurrency(form, adminCurrencies.map((c) => c.code), existing?.code),
    [form, existing]
  )

  const saveForm = () => {
    if (!validation.valid) return false
    setForm((f) => ({
      ...f,
      code: trim(f.code),
      name: trim(f.name),
      symbol: trim(f.symbol),
    }))
    return true
  }

  return (
    <AdminFormLayout
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: isEdit ? config.editTitle : config.createTitle }]}
      title={isEdit ? config.editTitle : config.createTitle}
      subtitle={isEdit ? `Modificando ${existing!.code}` : 'Nueva moneda del sistema'}
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
        <Input label="Código ISO *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DOP" maxLength={3} />
        <Input label="Símbolo *" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="RD$" />
        <Input label="Nombre *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Peso Dominicano" className="md:col-span-2" />
        <Input label="Decimales" type="number" value={form.decimalPlaces} onChange={(e) => setForm({ ...form, decimalPlaces: e.target.value })} min={0} max={4} />
        <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
      </div>
    </AdminFormLayout>
  )
}

export function CurrencyDetailPage() {
  const { id } = useParams()
  const currency = getCurrencyById(id!)
  if (!currency) return <RecordNotFound moduleLabel="moneda" listPath={config.basePath} />

  const relatedRates = adminExchangeRates.filter(
    (r) => r.fromCurrency === currency.code || r.toCurrency === currency.code
  )

  return (
    <AdminDetailLayout
      config={config}
      id={currency.id}
      breadcrumbs={[{ label: config.label, to: config.basePath }, { label: config.detailTitle }]}
      title={currency.name}
      subtitle={currency.code}
      statusBadge={<Badge variant={currency.status === 'active' ? 'success' : 'neutral'}>{currency.status === 'active' ? 'Activa' : 'Inactiva'}</Badge>}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailSection title="Información General">
          <dl>
            <DetailRow label="Código" value={<Badge variant="gold">{currency.code}</Badge>} />
            <DetailRow label="Nombre" value={currency.name} />
            <DetailRow label="Símbolo" value={<span className="text-2xl font-bold text-corporate">{currency.symbol}</span>} />
            <DetailRow label="Decimales" value={currency.decimalPlaces} />
            <DetailRow label="Moneda predeterminada" value={currency.isDefault ? 'Sí' : 'No'} />
            <DetailRow label="Estado" value={<Badge variant={currency.status === 'active' ? 'success' : 'neutral'}>{currency.status === 'active' ? 'Activa' : 'Inactiva'}</Badge>} />
          </dl>
        </DetailSection>

        <DetailSection title="Tasas de Cambio Relacionadas">
          {relatedRates.length > 0 ? (
            <dl>
              {relatedRates.map((r) => (
                <DetailRow
                  key={r.id}
                  label={`${r.fromCurrency} → ${r.toCurrency}`}
                  value={<span className="font-semibold text-corporate">{r.value.toFixed(4)}</span>}
                />
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-500 py-4">No hay tasas de cambio configuradas para esta moneda.</p>
          )}
        </DetailSection>
      </div>
    </AdminDetailLayout>
  )
}

export function CurrencyDeletePage() {
  const { id } = useParams()
  const currency = getCurrencyById(id!)
  if (!currency) return <RecordNotFound moduleLabel="moneda" listPath={config.basePath} />

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
    />
  )
}
