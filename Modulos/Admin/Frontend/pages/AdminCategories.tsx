import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { adminPath } from '@/lib/adminConfig'
import { validateAdminCategory } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { categoriasApi } from '@/services/api/categoriasApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

type Category = {
  id: string
  code?: string
  name: string
  description: string
  status: string
  productCount: number
}

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export function AdminCategories() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [q, setQ] = useState('')
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [form, setForm] = useState({ code: '', name: '', description: '', status: 'active' })

  const load = useCallback(async () => {
    try {
      const list = (await categoriasApi.list({ q })) as Category[]
      setCategories(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }, [q, showError])

  useEffect(() => {
    void load()
  }, [load])

  const selected = dialog ? categories.find((c) => c.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        code: selected.code || '',
        name: selected.name,
        description: selected.description || '',
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(
    () => validateAdminCategory(form, categories.map((c) => c.name), selected?.name),
    [form, categories, selected]
  )

  async function handleSave() {
    if (!selected || !validation.valid) return false
    try {
      await categoriasApi.update(selected.id, {
        code: trim(form.code) || selected.code,
        name: trim(form.name),
        description: trim(form.description),
        status: form.status,
      })
      showSuccess('Categoría actualizada')
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  async function toggle(c: Category) {
    try {
      await categoriasApi.setEstado(c.id, c.status === 'active' ? 'inactive' : 'active')
      showSuccess(c.status === 'active' ? 'Categoría desactivada' : 'Categoría activada')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/inventario" className="text-corporate hover:underline">
            Inventario
          </Link>
          <span>/</span>
          <span>Categorías</span>
          <span className="ml-2">— {categories.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('categorias', 'nuevo'))}>
          Crear Categoría
        </Button>
      </div>

      <div className="max-w-md">
        <Input label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o código…" />
      </div>

      <Card>
        <CardHeader title="Catálogo de Categorías" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={categories}
            columns={[
              { key: 'code', header: 'Código', render: (c) => <Badge variant="gold">{c.code || c.id}</Badge> },
              { key: 'name', header: 'Nombre', render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
              { key: 'description', header: 'Descripción', className: 'text-sm text-gray-600 max-w-xs' },
              {
                key: 'productCount',
                header: 'Productos',
                render: (c) => <span className="font-semibold text-corporate">{Number(c.productCount || 0).toLocaleString()}</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const s = statusMap[c.status] || statusMap.inactive
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (c) => (
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggle(c)}>
                      {c.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => navigate(adminPath('categorias', 'ver', c.id))}
                      onEdit={() => navigate(adminPath('categorias', 'editar', c.id))}
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
        title={dialog?.mode === 'edit' ? 'Editar Categoría' : 'Detalle'}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={() => void handleSave()}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="Descripción" value={selected.description} />
            <DetailRow label="Estado" value={<Badge variant={statusMap[selected.status]?.variant || 'neutral'}>{statusMap[selected.status]?.label}</Badge>} />
          </>
        ) : selected ? (
          <div className="grid gap-4 max-w-2xl">
            <Input label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
          </div>
        ) : null}
      </FormDialog>
    </div>
  )
}
