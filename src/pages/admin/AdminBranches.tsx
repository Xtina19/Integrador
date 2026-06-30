import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Phone, User } from 'lucide-react'
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
import { validateAdminBranch } from '../../business-rules/adminValidators'
import { trim } from '../../utils/formValidation'

const statusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'neutral' },
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export function AdminBranches() {
  const navigate = useNavigate()
  const { branches, updateBranch, deleteBranch } = useAdminCatalog()
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', manager: '', status: 'active' })

  const selected = dialog ? branches.find((b) => b.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        name: selected.name,
        address: selected.address,
        city: selected.city,
        phone: selected.phone,
        manager: selected.manager,
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(
    () =>
      validateAdminBranch(
        { ...form, code: selected?.id ?? '' },
        branches.map((b) => b.id),
        branches.map((b) => b.name),
        selected?.id,
        selected?.name
      ),
    [form, branches, selected]
  )

  function handleSave() {
    if (!selected || !validation.valid) return false
    updateBranch(selected.id, {
      name: trim(form.name),
      address: trim(form.address),
      city: trim(form.city),
      phone: trim(form.phone),
      manager: trim(form.manager),
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
          <span>Sucursales</span>
          <span className="ml-2">— {branches.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('sucursales', 'nuevo'))}>
          Registrar Sucursal
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Sucursales" subtitle="Puntos de venta, almacén central y ubicaciones" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={branches}
            columns={[
              { key: 'name', header: 'Nombre', render: (b) => <span className="font-medium text-gray-900">{b.name}</span> },
              {
                key: 'address',
                header: 'Dirección',
                render: (b) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin size={12} className="text-gold-dark shrink-0" />
                    <span>{b.address}</span>
                  </div>
                ),
              },
              {
                key: 'phone',
                header: 'Teléfono',
                render: (b) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span>{b.phone}</span>
                  </div>
                ),
              },
              {
                key: 'manager',
                header: 'Encargado',
                render: (b) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span>{b.manager}</span>
                  </div>
                ),
              },
              {
                key: 'inventory',
                header: 'Inventario',
                render: (b) => <span className="font-semibold text-corporate">{b.inventory.toLocaleString()} uds.</span>,
              },
              {
                key: 'status',
                header: 'Estado',
                render: (b) => {
                  const s = statusMap[b.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (b) => (
                  <TableActions
                    onView={() => setDialog({ id: b.id, mode: 'view' })}
                    onEdit={() => setDialog({ id: b.id, mode: 'edit' })}
                    onDelete={() => setDeleteId(b.id)}
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
        title={dialog?.mode === 'edit' ? 'Editar Sucursal' : 'Detalle de Sucursal'}
        subtitle={selected?.city}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={handleSave}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="Ciudad" value={selected.city} />
            <DetailRow label="Dirección" value={selected.address} />
            <DetailRow label="Teléfono" value={selected.phone} />
            <DetailRow label="Encargado" value={selected.manager} />
            <DetailRow label="Inventario" value={<span className="font-semibold text-corporate">{selected.inventory.toLocaleString()} uds.</span>} />
            <DetailRow label="Estado" value={<Badge variant={statusMap[selected.status].variant}>{statusMap[selected.status].label}</Badge>} />
          </>
        ) : selected ? (
          <>
          {!validation.valid && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 mb-4">
              {validation.errors[0]}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
            <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
            <Input label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Encargado" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
          </div>
          </>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          deleteBranch(deleteId)
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar esta sucursal del catálogo?"
      />
    </div>
  )
}
