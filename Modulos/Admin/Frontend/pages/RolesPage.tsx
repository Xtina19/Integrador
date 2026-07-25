import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { useToast } from '@/context/ToastContext'
import { getFriendlyErrorMessage } from '@/services/http'
import { rolesApi } from '@/services/api/rolesApi'

type Row = { id: string; code: string; name: string; status: string; description?: string; users?: number }

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export function RolesPage() {
  const { showSuccess, showError } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [q, setQ] = useState('')
  const [dialog, setDialog] = useState<{ id: string | null; mode: 'create' | 'edit' | 'view' } | null>(null)
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'active' })

  const load = useCallback(async () => {
    try {
      const list = await rolesApi.list()
      setRows(list as Row[])
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (r) =>
        r.code?.toLowerCase().includes(term) ||
        r.name?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
    )
  }, [rows, q])

  const selected = dialog?.id ? rows.find((r) => r.id === dialog.id) ?? null : null

  useEffect(() => {
    if (dialog?.mode === 'create') {
      setForm({ code: '', name: '', description: '', status: 'active' })
    } else if (selected && (dialog?.mode === 'edit' || dialog?.mode === 'view')) {
      setForm({
        code: selected.code,
        name: selected.name,
        description: selected.description || '',
        status: selected.status,
      })
    }
  }, [dialog, selected])

  async function handleSave() {
    if (!form.code.trim() || !form.name.trim()) {
      showError('Código y nombre son obligatorios')
      return false
    }
    try {
      const body = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      }
      if (dialog?.mode === 'create') {
        await rolesApi.create(body)
        showSuccess('Registro creado')
      } else if (dialog?.id) {
        await rolesApi.update(dialog.id, body)
        showSuccess('Registro actualizado')
      }
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  async function toggle(r: Row) {
    try {
      await rolesApi.setEstado(r.id, r.status === 'active' ? 'inactive' : 'active')
      showSuccess(r.status === 'active' ? 'Desactivado' : 'Activado')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">
            Administración
          </Link>
          <span>/</span>
          <span>Roles</span>
          <span className="ml-2">— {filtered.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => setDialog({ id: null, mode: 'create' })}>
          Nuevo
        </Button>
      </div>

      <div className="max-w-md">
        <Input label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Código o nombre…" />
      </div>

      <Card>
        <CardHeader title="Roles" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Código', render: (r) => <Badge variant="gold">{r.code}</Badge> },
              { key: 'name', header: 'Nombre', render: (r) => <span className="font-medium">{r.name}</span> },
              {
                key: 'description',
                header: 'Descripción',
                render: (r) => <span className="text-sm text-gray-600">{r.description || '—'}</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (r) => (
                  <Badge variant={r.status === 'active' ? 'success' : 'neutral'}>
                    {r.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggle(r)}>
                      {r.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => setDialog({ id: r.id, mode: 'view' })}
                      onEdit={() => setDialog({ id: r.id, mode: 'edit' })}
                    />
                  </div>
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'create' ? 'Nueva Roles' : dialog?.mode === 'edit' ? 'Editar Roles' : 'Detalle'}
        mode={dialog?.mode === 'view' ? 'view' : 'edit'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={() => void handleSave()}
      >
        {dialog?.mode === 'view' && selected ? (
          <>
            <DetailRow label="Código" value={<Badge variant="gold">{selected.code}</Badge>} />
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="Descripción" value={selected.description || '—'} />
            <DetailRow
              label="Estado"
              value={
                <Badge variant={selected.status === 'active' ? 'success' : 'neutral'}>
                  {selected.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              }
            />
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <Input label="Código *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <Select
              label="Estado"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={statusOptions}
            />
            <Input
              label="Nombre *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="md:col-span-2"
            />
            <Input
              label="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="md:col-span-2"
            />
          </div>
        )}
      </FormDialog>
    </div>
  )
}
