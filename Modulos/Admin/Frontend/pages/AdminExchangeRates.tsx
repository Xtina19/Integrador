import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { adminPath } from '@/lib/adminConfig'
import { validateAdminExchangeRate } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { tasasCambioApi } from '@/services/api/tasasCambioApi'
import { monedasApi } from '@/services/api/monedasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

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

export function AdminExchangeRates() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [currencyCodes, setCurrencyCodes] = useState<string[]>(['DOP', 'USD'])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [form, setForm] = useState({
    fromCurrency: 'USD',
    toCurrency: 'DOP',
    value: '',
    date: '',
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rates, monedas] = await Promise.all([tasasCambioApi.list(), monedasApi.list()])
      setExchangeRates(rates as ExchangeRate[])
      setCurrencyCodes(monedas.map((m) => m.code))
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const selected = dialog ? exchangeRates.find((r) => r.id === dialog.id) ?? null : null
  const currencyOptions = currencyCodes.map((c) => ({ value: c, label: c }))

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        fromCurrency: selected.fromCurrency,
        toCurrency: selected.toCurrency,
        value: String(selected.value),
        date: selected.date,
        notes: selected.notes || '',
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

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

  async function handleSave() {
    if (!selected || !validation.valid) return false
    try {
      await tasasCambioApi.update(selected.id, {
        fromCurrency: form.fromCurrency,
        toCurrency: form.toCurrency,
        value: Number(form.value) || 0,
        date: trim(form.date),
        notes: trim(form.notes),
      })
      showSuccess('Tasa de cambio actualizada')
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/configuracion" className="text-corporate hover:underline">Configuración</Link>
          <span>/</span>
          <span>Tasas de Cambio</span>
          <span className="ml-2">— {loading ? '…' : `${exchangeRates.length} tasas`}</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('tasas-cambio', 'nuevo'))}>
          Actualizar Tasa
        </Button>
      </div>

      <Card>
        <CardHeader title="Tasas de Cambio" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={exchangeRates}
            columns={[
              {
                key: 'fromCurrency',
                header: 'Moneda Origen',
                render: (r) => <Badge variant="gold">{r.fromCurrency}</Badge>,
              },
              {
                key: 'arrow',
                header: '',
                render: () => <ArrowRight size={14} className="text-gray-400" />,
                className: 'w-8',
              },
              {
                key: 'toCurrency',
                header: 'Moneda Destino',
                render: (r) => <Badge variant="neutral">{r.toCurrency}</Badge>,
              },
              {
                key: 'value',
                header: 'Valor',
                render: (r) => <span className="font-bold text-corporate text-base">{r.value.toFixed(4)}</span>,
              },
              { key: 'date', header: 'Fecha', className: 'text-sm text-gray-600' },
              { key: 'updatedBy', header: 'Actualizado por', className: 'text-sm' },
              {
                key: 'status',
                header: 'Estado',
                render: (r) => (
                  <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>
                    {r.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (r) => (
                  <TableActions
                    onView={() => navigate(adminPath('tasas-cambio', 'ver', r.id))}
                    onEdit={() => navigate(adminPath('tasas-cambio', 'editar', r.id))}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(dialog && selected)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Editar Tasa de Cambio' : 'Detalle de Tasa de Cambio'}
        subtitle={selected ? `${selected.fromCurrency} → ${selected.toCurrency}` : undefined}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={() => void handleSave()}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Moneda Origen" value={<Badge variant="gold">{selected.fromCurrency}</Badge>} />
            <DetailRow label="Moneda Destino" value={<Badge variant="neutral">{selected.toCurrency}</Badge>} />
            <DetailRow label="Valor" value={<span className="font-bold text-corporate text-lg">{selected.value.toFixed(4)}</span>} />
            <DetailRow label="Fecha" value={selected.date} />
            <DetailRow label="Actualizado por" value={selected.updatedBy || '—'} />
            <DetailRow label="Notas" value={selected.notes || '—'} />
          </>
        ) : selected ? (
          <>
          {!validation.valid && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
              {validation.errors[0]}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Select label="Moneda Origen" value={form.fromCurrency} onChange={(e) => setForm({ ...form, fromCurrency: e.target.value })} options={currencyOptions} />
            <Select label="Moneda Destino" value={form.toCurrency} onChange={(e) => setForm({ ...form, toCurrency: e.target.value })} options={currencyOptions} />
            <Input label="Valor" type="number" step="0.0001" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            <Input label="Fecha" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            <Textarea label="Notas" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="md:col-span-2" rows={3} />
          </div>
          </>
        ) : null}
      </FormDialog>
    </div>
  )
}
