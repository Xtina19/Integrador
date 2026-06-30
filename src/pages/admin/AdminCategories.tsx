import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { FormDialog, DetailRow } from '../../components/ui/FormDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { adminPath } from '../../lib/adminConfig'
import { useAdminCatalog } from '../../context/AdminCatalogContext'
import { validateAdminCategory } from '../../business-rules/adminValidators'
import { trim } from '../../utils/formValidation'

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
  const { categories, updateCategory, deleteCategory } = useAdminCatalog()
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', status: 'active' })

  const selected = dialog ? categories.find((c) => c.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        name: selected.name,
        description: selected.description,
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(
    () => validateAdminCategory(form, categories.map((c) => c.name), selected?.name),
    [form, categories, selected]
  )

  function handleSave() {
    if (!selected || !validation.valid) return false
    updateCategory(selected.id, {
      name: trim(form.name),
      description: trim(form.description),
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
          <span>Categorías</span>
          <span className="ml-2">— {categories.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('categorias', 'nuevo'))}>
          Crear Categoría
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Categorías" subtitle="Clasificación maestra de productos" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={categories}
            columns={[
              { key: 'id', header: 'ID', className: 'text-xs font-mono text-gray-400' },
              { key: 'name', header: 'Nombre', render: (c) => <span className="font-medium text-gray-900">{c.name}</span> },
              { key: 'description', header: 'Descripción', className: 'text-sm text-gray-600 max-w-xs' },
              {
                key: 'productCount',
                header: 'Productos',
                render: (c) => <span className="font-semibold text-corporate">{c.productCount.toLocaleString()}</span>,
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
        title={dialog?.mode === 'edit' ? 'Editar Categoría' : 'Detalle de Categoría'}
        subtitle={selected?.id}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={handleSave}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="Descripción" value={selected.description} />
            <DetailRow label="Estado" value={<Badge variant={statusMap[selected.status].variant}>{statusMap[selected.status].label}</Badge>} />
            <DetailRow label="Productos" value={<span className="font-semibold text-corporate">{selected.productCount.toLocaleString()}</span>} />
          </>
        ) : selected ? (
          <>
          {!validation.valid && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
              {validation.errors[0]}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 max-w-2xl">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Textarea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
            <DetailRow label="Productos" value={<span className="font-semibold text-corporate">{selected.productCount.toLocaleString()}</span>} />
          </div>
          </>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          deleteCategory(deleteId)
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar esta categoría del catálogo?"
      />
    </div>
  )
}
