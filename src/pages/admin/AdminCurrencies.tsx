import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { FormDialog, DetailRow } from '../../components/ui/FormDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { adminPath } from '../../lib/adminConfig'
import { useAdminCatalog } from '../../context/AdminCatalogContext'

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
  const { currencies, updateCurrency, deleteCurrency } = useAdminCatalog()
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', symbol: '', decimalPlaces: '2', status: 'active' })

  const selected = dialog ? currencies.find((c) => c.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        code: selected.code,
        name: selected.name,
        symbol: selected.symbol,
        decimalPlaces: String(selected.decimalPlaces),
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  function handleSave() {
    if (!selected) return
    updateCurrency(selected.id, {
      code: form.code,
      name: form.name,
      symbol: form.symbol,
      decimalPlaces: Number(form.decimalPlaces) || 2,
      status: form.status as 'active' | 'inactive',
    })
    setDialog(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Monedas</span>
          <span className="ml-2">— {currencies.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('monedas', 'nuevo'))}>
          Registrar Moneda
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Monedas" subtitle="Monedas habilitadas en el sistema" />
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
              { key: 'name', header: 'Nombre', render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
              {
                key: 'symbol',
                header: 'Símbolo',
                render: (c) => <span className="text-lg font-semibold text-corporate">{c.symbol}</span>,
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
                  <TableActions
                    onView={() => setDialog({ id: c.id, mode: 'view' })}
                    onEdit={() => setDialog({ id: c.id, mode: 'edit' })}
                    onDelete={() => setDeleteId(c.id)}
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
        title={dialog?.mode === 'edit' ? 'Editar Moneda' : 'Detalle de Moneda'}
        subtitle={selected?.code}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={handleSave}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Código" value={<Badge variant="gold">{selected.code}</Badge>} />
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="Símbolo" value={<span className="text-lg font-semibold text-corporate">{selected.symbol}</span>} />
            <DetailRow label="Decimales" value={selected.decimalPlaces} />
            <DetailRow label="Moneda predeterminada" value={selected.isDefault ? 'Sí' : 'No'} />
            <DetailRow label="Estado" value={<Badge variant={statusMap[selected.status].variant}>{statusMap[selected.status].label}</Badge>} />
          </>
        ) : selected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Input label="Código ISO" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} maxLength={3} />
            <Input label="Símbolo" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
            <Input label="Decimales" type="number" value={form.decimalPlaces} onChange={(e) => setForm({ ...form, decimalPlaces: e.target.value })} min={0} max={4} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
          </div>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          deleteCurrency(deleteId)
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar esta moneda del catálogo?"
      />
    </div>
  )
}
