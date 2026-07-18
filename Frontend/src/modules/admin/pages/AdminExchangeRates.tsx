import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { exchangeRateHistory, currencyCodes } from '@/mocks/mockAdmin'
import { adminPath } from '@/lib/adminConfig'
import { useAdminCatalog } from '@/context/AdminCatalogContext'
import { validateAdminExchangeRate } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'

export function AdminExchangeRates() {
  const navigate = useNavigate()
  const { exchangeRates, updateExchangeRate, deleteExchangeRate } = useAdminCatalog()
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    fromCurrency: 'USD',
    toCurrency: 'DOP',
    value: '',
    date: '',
    notes: '',
  })

  const selected = dialog ? exchangeRates.find((r) => r.id === dialog.id) ?? null : null
  const currencyOptions = currencyCodes.map((c) => ({ value: c, label: c }))

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        fromCurrency: selected.fromCurrency,
        toCurrency: selected.toCurrency,
        value: String(selected.value),
        date: selected.date,
        notes: selected.notes,
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

  function handleSave() {
    if (!selected || !validation.valid) return false
    updateExchangeRate(selected.id, {
      fromCurrency: form.fromCurrency,
      toCurrency: form.toCurrency,
      value: Number(form.value) || 0,
      date: trim(form.date),
      notes: trim(form.notes),
    })
    setDialog(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Tasas de Cambio</span>
          <span className="ml-2">— {exchangeRates.length} tasas vigentes</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('tasas-cambio', 'nuevo'))}>
          Actualizar Tasa
        </Button>
      </div>

      <Card>
        <CardHeader title="Tasas de Cambio Vigentes" />
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
                key: 'actions',
                header: 'Acciones',
                render: (r) => (
                  <TableActions
                    onView={() => setDialog({ id: r.id, mode: 'view' })}
                    onEdit={() => setDialog({ id: r.id, mode: 'edit' })}
                    onDelete={() => setDeleteId(r.id)}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historial de Cambios" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={exchangeRateHistory}
            columns={[
              {
                key: 'fromCurrency',
                header: 'Origen',
                render: (r) => <Badge variant="gold">{r.fromCurrency}</Badge>,
              },
              {
                key: 'toCurrency',
                header: 'Destino',
                render: (r) => <Badge variant="neutral">{r.toCurrency}</Badge>,
              },
              {
                key: 'value',
                header: 'Valor',
                render: (r) => <span className="font-semibold text-corporate">{r.value.toFixed(4)}</span>,
              },
              { key: 'date', header: 'Fecha/Hora', className: 'text-xs text-gray-500 whitespace-nowrap' },
              { key: 'updatedBy', header: 'Usuario', className: 'text-sm font-medium' },
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
        onSave={handleSave}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Moneda Origen" value={<Badge variant="gold">{selected.fromCurrency}</Badge>} />
            <DetailRow label="Moneda Destino" value={<Badge variant="neutral">{selected.toCurrency}</Badge>} />
            <DetailRow label="Valor" value={<span className="font-bold text-corporate text-lg">{selected.value.toFixed(4)}</span>} />
            <DetailRow label="Fecha" value={selected.date} />
            <DetailRow label="Actualizado por" value={selected.updatedBy} />
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

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          deleteExchangeRate(deleteId)
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar esta tasa de cambio?"
      />
    </div>
  )
}
