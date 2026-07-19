import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Mail, Phone, User } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { adminPath } from '@/lib/adminConfig'
import { validateAdminSupplier } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { proveedoresApi } from '@/services/api/proveedoresApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

type Supplier = {
  id: string
  code: string
  name: string
  contact: string
  email: string
  phone: string
  supplierType: string
  country: string
  status: string
  purchasesCount: number
  address: string
}

const supplierTypes = ['Distribuidor', 'Editorial', 'Logística', 'Material de oficina', 'Tecnología']

export function AdminSuppliers() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [form, setForm] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    supplierType: supplierTypes[0],
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = (await proveedoresApi.list()) as Supplier[]
      setSuppliers(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    void load()
  }, [load])

  const selected = dialog ? suppliers.find((s) => s.id === dialog.id) ?? null : null

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        name: selected.name,
        contact: selected.contact,
        email: selected.email,
        phone: selected.phone,
        address: selected.address || '',
        supplierType: selected.supplierType,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(
    () =>
      validateAdminSupplier(
        {
          name: form.name,
          code: selected?.code ?? '',
          type: form.supplierType,
          country: selected?.country || 'República Dominicana',
          contact: form.contact,
          phone: form.phone,
          email: form.email,
        },
        suppliers.map((s) => s.code),
        suppliers.map((s) => s.name),
        selected?.code,
        selected?.name
      ),
    [form, suppliers, selected]
  )

  async function handleSave() {
    if (!selected || !validation.valid) return false
    try {
      await proveedoresApi.update(selected.id, {
        name: trim(form.name),
        contact: trim(form.contact),
        email: trim(form.email),
        phone: trim(form.phone),
        country: selected.country || 'República Dominicana',
        tipo: form.supplierType === 'Editorial' ? 'internacional' : 'nacional',
      })
      showSuccess('Proveedor actualizado')
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  async function toggle(s: Supplier) {
    try {
      await proveedoresApi.setEstado(s.id, s.status === 'active' ? 'inactive' : 'active')
      showSuccess(s.status === 'active' ? 'Proveedor desactivado' : 'Proveedor activado')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Proveedores</span>
          <span className="ml-2">— {loading ? '…' : `${suppliers.length} registros`}</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('proveedores', 'nuevo'))}>
          Registrar Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader title="Catálogo de Proveedores" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={suppliers}
            columns={[
              { key: 'code', header: 'Código', render: (s) => <Badge variant="gold">{s.code}</Badge> },
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
                key: 'status',
                header: 'Estado',
                render: (s) => (
                  <Badge variant={s.status === 'active' ? 'success' : 'neutral'}>
                    {s.status === 'active' ? 'Activo' : 'Inactivo'}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (s) => (
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggle(s)}>
                      {s.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => navigate(adminPath('proveedores', 'ver', s.id))}
                      onEdit={() => navigate(adminPath('proveedores', 'editar', s.id))}
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
        title={dialog?.mode === 'edit' ? 'Editar Proveedor' : 'Detalle de Proveedor'}
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
            <DetailRow label="Contacto" value={selected.contact} />
            <DetailRow label="Correo" value={selected.email} />
            <DetailRow label="Teléfono" value={selected.phone} />
            <DetailRow label="Tipo" value={<Badge variant="gold">{selected.supplierType}</Badge>} />
            <DetailRow label="País" value={selected.country || '—'} />
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
            <Input label="Contacto" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Input label="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select label="Tipo de Proveedor" value={form.supplierType} onChange={(e) => setForm({ ...form, supplierType: e.target.value })} options={supplierTypes.map((t) => ({ value: t, label: t }))} />
          </div>
          </>
        ) : null}
      </FormDialog>
    </div>
  )
}
