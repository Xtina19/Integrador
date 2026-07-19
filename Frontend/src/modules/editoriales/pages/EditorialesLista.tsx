import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Globe, BookMarked, Mail } from 'lucide-react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { TableActions } from '@/components/ui/TableActions'
import { Toolbar } from '@/components/ui/Toolbar'
import { Pagination } from '@/components/ui/Pagination'
import { FormDialog, DetailRow } from '@/components/ui/FormDialog'
import { adminPath } from '@/lib/adminConfig'
import { contractStatusConfig, getContractVisualStatus } from '@/lib/publisherContractStatus'
import { validateAdminPublisher } from '@/business-rules/adminValidators'
import { trim } from '@/utils/formValidation'
import { editorialesApi } from '@/services/api/editorialesApi'
import { getFriendlyErrorMessage } from '@/services/http'
import { useToast } from '@/context/ToastContext'

const PAGE_SIZE = 5

type Publisher = {
  id: string
  code: string
  name: string
  country: string
  contact: string
  phone: string
  address: string
  contractType: string
  contractExpiry: string
  status: string
  productCount: number
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const contractTypes = [
  'Distribución exclusiva',
  'Distribución regional',
  'Distribución nacional',
  'Convenio institucional',
]

export function EditorialesLista() {
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [form, setForm] = useState({
    name: '',
    country: '',
    contact: '',
    phone: '',
    address: '',
    contractType: contractTypes[0],
    contractExpiry: '',
    status: 'active',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = (await editorialesApi.list({ q: search || undefined })) as Publisher[]
      setPublishers(list)
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [search, showError])

  useEffect(() => {
    void load()
  }, [load])

  const selected = dialog ? publishers.find((p) => p.id === dialog.id) ?? null : null

  const filtered = useMemo(() => {
    return publishers.filter((p) => {
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.contact.includes(search)
      const visualStatus = getContractVisualStatus(p.contractExpiry)
      const matchStatus = statusFilter === 'all' || visualStatus === statusFilter
      return matchSearch && matchStatus
    })
  }, [publishers, search, statusFilter])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        name: selected.name,
        country: selected.country,
        contact: selected.contact,
        phone: selected.phone,
        address: selected.address || '',
        contractType: selected.contractType || contractTypes[0],
        contractExpiry: selected.contractExpiry,
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.id])

  const validation = useMemo(
    () => validateAdminPublisher({ ...form, address: form.address || 'Sin dirección registrada' }, publishers.map((p) => p.name), selected?.name),
    [form, publishers, selected]
  )

  async function handleSave() {
    if (!selected || !validation.valid) return false
    try {
      await editorialesApi.update(selected.id, {
        name: trim(form.name),
        country: trim(form.country),
        contact: trim(form.contact),
        phone: trim(form.phone),
        contractType: form.contractType,
        contractExpiry: form.contractExpiry,
        status: form.status,
      })
      showSuccess('Editorial actualizada')
      setDialog(null)
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
      return false
    }
  }

  async function toggle(p: Publisher) {
    try {
      await editorialesApi.setEstado(p.id, p.status === 'active' ? 'inactive' : 'active')
      showSuccess(p.status === 'active' ? 'Editorial desactivada' : 'Editorial activada')
      await load()
    } catch (err) {
      showError(getFriendlyErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate(adminPath('editoriales', 'nuevo'))}>Registrar Editorial</Button>
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1) }}
            searchPlaceholder="Buscar por nombre o correo..."
            filters={
              <Select
                label="Estado contrato"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Vigente' },
                  { value: 'expiring', label: 'Por vencer' },
                  { value: 'expired', label: 'Vencido' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Editoriales" subtitle={loading ? 'Cargando…' : `${filtered.length} registros`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={paginated}
            columns={[
              {
                key: 'name',
                header: 'Editorial',
                render: (p) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <BookMarked size={16} className="text-corporate" />
                    </div>
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                ),
              },
              { key: 'contact', header: 'Correo', render: (p) => <span className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} />{p.contact}</span> },
              { key: 'country', header: 'País', render: (p) => <div className="flex items-center gap-1.5"><Globe size={14} className="text-gray-400" />{p.country}</div> },
              { key: 'contractType', header: 'Tipo de Contrato' },
              { key: 'productCount', header: 'Productos', render: (p) => <span className="font-semibold text-corporate">{p.productCount}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (p) => {
                  const s = contractStatusConfig[getContractVisualStatus(p.contractExpiry)]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              { key: 'contractExpiry', header: 'Vencimiento' },
              {
                key: 'actions',
                header: 'Acciones',
                render: (p) => (
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-xs font-medium text-corporate hover:underline" onClick={() => void toggle(p)}>
                      {p.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                    <TableActions
                      onView={() => navigate(adminPath('editoriales', 'ver', p.id))}
                      onEdit={() => navigate(adminPath('editoriales', 'editar', p.id))}
                    />
                  </div>
                ),
              },
            ]}
          />
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </CardBody>
      </Card>

      <FormDialog
        open={Boolean(dialog && selected)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Editar Editorial' : 'Detalle de Editorial'}
        subtitle={selected?.country}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={() => void handleSave()}
        saveDisabled={!validation.valid}
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="País" value={selected.country} />
            <DetailRow label="Contacto" value={selected.contact} />
            <DetailRow label="Teléfono" value={selected.phone} />
            <DetailRow label="Tipo de Contrato" value={<Badge variant="gold">{selected.contractType}</Badge>} />
            <DetailRow label="Vencimiento" value={selected.contractExpiry} />
            <DetailRow label="Productos asociados" value={<span className="font-semibold text-corporate">{selected.productCount}</span>} />
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
            <Input label="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input label="Contacto" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Select label="Tipo de Contrato" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} options={contractTypes.map((t) => ({ value: t, label: t }))} />
            <Input label="Vencimiento contrato" type="date" value={form.contractExpiry} onChange={(e) => setForm({ ...form, contractExpiry: e.target.value })} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
          </div>
          </>
        ) : null}
      </FormDialog>
    </div>
  )
}
