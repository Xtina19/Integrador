import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Mail, Phone, User } from 'lucide-react'
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

const supplierTypes = ['Distribuidor', 'Editorial', 'Logística', 'Material de oficina', 'Tecnología']

export function AdminSuppliers() {
  const navigate = useNavigate()
  const { suppliers, updateSupplier, deleteSupplier } = useAdminCatalog()
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    supplierType: supplierTypes[0],
  })

  const selected = dialog ? suppliers.find((s) => s.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        name: selected.name,
        contact: selected.contact,
        email: selected.email,
        phone: selected.phone,
        address: selected.address,
        supplierType: selected.supplierType,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  function handleSave() {
    if (!selected) return
    updateSupplier(selected.id, {
      name: form.name,
      contact: form.contact,
      email: form.email,
      phone: form.phone,
      address: form.address,
      supplierType: form.supplierType,
    })
    setDialog(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Proveedores</span>
          <span className="ml-2">— {suppliers.length} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('proveedores', 'nuevo'))}>
          Registrar Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Proveedores" subtitle="Proveedores, distribuidores y servicios" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={suppliers}
            columns={[
              { key: 'name', header: 'Nombre', render: (s) => <span className="font-medium text-gray-900">{s.name}</span> },
              {
                key: 'contact',
                header: 'Contacto',
                render: (s) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span>{s.contact}</span>
                  </div>
                ),
              },
              {
                key: 'email',
                header: 'Correo',
                render: (s) => (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Mail size={10} className="shrink-0" />
                    <span>{s.email}</span>
                  </div>
                ),
              },
              {
                key: 'phone',
                header: 'Teléfono',
                render: (s) => (
                  <div className="flex items-center gap-1.5 text-sm">
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                ),
              },
              { key: 'supplierType', header: 'Tipo', render: (s) => <Badge variant="neutral">{s.supplierType}</Badge> },
              {
                key: 'purchasesCount',
                header: 'Compras',
                render: (s) => <span className="font-semibold text-corporate">{s.purchasesCount}</span>,
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (s) => (
                  <TableActions
                    onView={() => setDialog({ id: s.id, mode: 'view' })}
                    onEdit={() => setDialog({ id: s.id, mode: 'edit' })}
                    onDelete={() => setDeleteId(s.id)}
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
        title={dialog?.mode === 'edit' ? 'Editar Proveedor' : 'Detalle de Proveedor'}
        subtitle={selected?.supplierType}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={handleSave}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="Contacto" value={selected.contact} />
            <DetailRow label="Correo" value={selected.email} />
            <DetailRow label="Teléfono" value={selected.phone} />
            <DetailRow label="Dirección" value={selected.address} />
            <DetailRow label="Tipo" value={<Badge variant="gold">{selected.supplierType}</Badge>} />
            <DetailRow label="Compras" value={<span className="font-semibold text-corporate">{selected.purchasesCount}</span>} />
          </>
        ) : selected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
            <Input label="Contacto" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
            <Select label="Tipo de Proveedor" value={form.supplierType} onChange={(e) => setForm({ ...form, supplierType: e.target.value })} options={supplierTypes.map((t) => ({ value: t, label: t }))} />
          </div>
        ) : null}
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          deleteSupplier(deleteId)
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar este proveedor del catálogo?"
      />
    </div>
  )
}
