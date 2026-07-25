import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { adminPath } from '@/lib/adminConfig'
import { validateAdminCurrency } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { monedasApi, type MonedaDto } from '@/services/api/monedasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activa', variant: 'success' },
  inactive: { label: 'Inactiva', variant: 'neutral' },
}

const statusOptions = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
]

export function AdminCurrencies() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [currencies, setCurrencies] = useState<MonedaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', symbol: '', status: 'active' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await monedasApi.list()
      setCurrencies(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const selected = dialog ? currencies.find((c) => c.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        code: selected.code,
        name: selected.name,
        symbol: selected.symbol,
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(
    () => validateAdminCurrency(form, currencies.map((c) => c.code), selected?.code),
    [form, currencies, selected]
  )

  async function handleSave() {
    if (!selected || !validation.valid) return false
    try {
      await monedasApi.update(selected.id, {
        code: trim(form.code),
        name: trim(form.name),
        symbol: trim(form.symbol),
        status: form.status as 'active' | 'inactive',
      })
      showSuccess('Moneda actualizada')
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  async function handleToggleEstado(c: MonedaDto) {
    const next = c.status === 'active' ? 'inactive' : 'active'
    try {
      await monedasApi.setEstado(c.id, next)
      showSuccess(next === 'active' ? 'Moneda activada' : 'Moneda desactivada')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      await monedasApi.remove(deleteId)
      showSuccess('Moneda eliminada')
      setDeleteId(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/configuracion" className="text-corporate hover:underline">
            Configuración
          </Link>
          <span>/</span>
          <span>Monedas</span>
          <span className="ml-2">— {loading ? '…' : `${currencies.length} registros`}</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('monedas', 'nuevo'))}>
          Registrar Moneda
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Monedas" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={currencies}
            columns={[
              {
                key: 'code',
                header: 'Código',
                render: (c) => <Badge variant="gold">{c.code}</Badge>,
              },
              {
                key: 'name',
                header: 'Nombre',
                render: (c) => <span className="font-medium text-gray-900">{c.name}</span>,
              },
              {
                key: 'symbol',
                header: 'Símbolo',
                render: (c) => (
                  <span className="text-lg font-semibold text-corporate">{c.symbol}</span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const s = statusMap[c.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-corporate hover:underline"
                      onClick={() => void handleToggleEstado(c)}
                    >
                      {c.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => navigate(adminPath('monedas', 'ver', c.id))}
                      onEdit={() => navigate(adminPath('monedas', 'editar', c.id))}
                      onDelete={() => setDeleteId(c.id)}
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(dialog && selected)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Editar Moneda' : 'Detalle de Moneda'}
        subtitle={selected?.code}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={() => void handleSave()}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Código" value={<Badge variant="gold">{selected.code}</Badge>} />
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow
              label="Símbolo"
              value={<span className="text-lg font-semibold text-corporate">{selected.symbol}</span>}
            />
            <DetailRow label="Moneda predeterminada" value={selected.isDefault ? 'Sí' : 'No'} />
            <DetailRow
              label="Estado"
              value={
                <Badge variant={statusMap[selected.status].variant}>
                  {statusMap[selected.status].label}
                </Badge>
              }
            />
          </>
        ) : selected ? (
          <>
            {!validation.valid && (
              <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
                {validation.errors[0]}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
              <Input
                label="Código ISO"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                maxLength={3}
              />
              <Input
                label="Símbolo"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value })}
              />
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="md:col-span-2"
              />
              <Select
                label="Estado"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                options={statusOptions}
              />
            </div>
          </>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => void handleDelete()}
        message="¿Está seguro de eliminar esta moneda del catálogo?"
      />
    </div>
  )
}
