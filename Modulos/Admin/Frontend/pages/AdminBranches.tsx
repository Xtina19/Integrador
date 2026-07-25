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
import { adminPath } from '@/lib/adminConfig'
import { trim } from '@/utils/formValidation'
import { almacenesApi } from '@/services/api/almacenesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

type Almacen = {
  id: string
  code: string
  name: string
  type: string
  status: string
}

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

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

export function AdminBranches() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'sucursal', status: 'active' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = (await almacenesApi.list()) as Almacen[]
      setAlmacenes(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const selected = dialog ? almacenes.find((b) => b.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        code: selected.code,
        name: selected.name,
        type: selected.type || 'sucursal',
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(() => {
    const name = trim(form.name)
    if (!name) return { valid: false, errors: ['Nombre es obligatorio'] }
    return { valid: true, errors: [] as string[] }
  }, [form.name])

  async function handleSave() {
    if (!selected || !validation.valid) return false
    try {
      await almacenesApi.update(selected.id, {
        code: trim(form.code) || selected.code,
        name: trim(form.name),
        type: form.type,
        status: form.status,
      })
      showSuccess('Almacén actualizado')
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  async function toggle(a: Almacen) {
    try {
      await almacenesApi.setEstado(a.id, a.status === 'active' ? 'inactive' : 'active')
      showSuccess(a.status === 'active' ? 'Almacén desactivado' : 'Almacén activado')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/inventario" className="text-corporate hover:underline">Inventario</Link>
          <span>/</span>
          <span>Almacenes</span>
          <span className="ml-2">— {loading ? '…' : `${almacenes.length} registros`}</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('sucursales', 'nuevo'))}>
          Registrar Almacén
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Almacenes" subtitle="Ubicaciones de inventario por tipo" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={almacenes}
            columns={[
              { key: 'code', header: 'Código', render: (b) => <Badge variant="gold">{b.code}</Badge> },
              { key: 'name', header: 'Nombre', render: (b) => <span className="font-medium text-gray-900">{b.name}</span> },
              { key: 'type', header: 'Tipo', render: (b) => <Badge variant="neutral">{typeLabels[b.type] || b.type}</Badge> },
              {
                key: 'status',
                header: 'Estado',
                render: (b) => {
                  const s = statusMap[b.status] || statusMap.inactive
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (b) => (
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggle(b)}>
                      {b.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => navigate(adminPath('sucursales', 'ver', b.id))}
                      onEdit={() => navigate(adminPath('sucursales', 'editar', b.id))}
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
        title={dialog?.mode === 'edit' ? 'Editar Almacén' : 'Detalle de Almacén'}
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
            <DetailRow label="Tipo" value={<Badge variant="neutral">{typeLabels[selected.type] || selected.type}</Badge>} />
            <DetailRow label="Estado" value={<Badge variant={statusMap[selected.status]?.variant || 'neutral'}>{statusMap[selected.status]?.label}</Badge>} />
          </>
        ) : selected ? (
          <>
          {!validation.valid && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
              {validation.errors[0]}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={typeOptions} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
          </div>
          </>
        ) : null}
      </FormDialog>
    </div>
  )
}
