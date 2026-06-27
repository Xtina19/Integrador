import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { FormDialog, DetailRow } from '../../components/ui/FormDialog'
import { publisherContracts } from '../../data/adminMockData'
import { contractStatusConfig, getContractVisualStatus } from '../../lib/publisherContractStatus'
import { useAdminCatalog } from '../../context/AdminCatalogContext'

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

export function ContratosPage() {
  const { publishers, updatePublisher } = useAdminCatalog()
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState<{ publisherId: string; mode: 'view' | 'edit' } | null>(null)
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

  const selected = dialog ? publishers.find((p) => p.id === dialog.publisherId) ?? null : null

  const filtered = useMemo(() => {
    return publisherContracts.filter(
      (c) =>
        search === '' ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.publisherName.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  useEffect(() => {
    if (selected && dialog?.mode === 'edit') {
      setForm({
        name: selected.name,
        country: selected.country,
        contact: selected.contact,
        phone: selected.phone,
        address: selected.address,
        contractType: selected.contractType,
        contractExpiry: selected.contractExpiry,
        status: selected.status,
      })
    }
  }, [selected, dialog?.mode, dialog?.publisherId])

  function handleSave() {
    if (!selected) return
    updatePublisher(selected.id, {
      name: form.name,
      country: form.country,
      contact: form.contact,
      phone: form.phone,
      address: form.address,
      contractType: form.contractType,
      contractExpiry: form.contractExpiry,
      status: form.status,
    } as Parameters<typeof updatePublisher>[1])
    setDialog(null)
  }

  function openEdit(publisherId: string) {
    setDialog({ publisherId, mode: 'edit' })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Buscar por código o editorial..." />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contratos Editoriales" subtitle={`${filtered.length} contratos registrados`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Código', render: (c) => <span className="font-mono text-xs text-corporate">{c.code}</span> },
              { key: 'publisherName', header: 'Editorial', render: (c) => <span className="font-medium">{c.publisherName}</span> },
              { key: 'type', header: 'Tipo' },
              { key: 'startDate', header: 'Fecha inicio', className: 'text-sm' },
              { key: 'endDate', header: 'Fecha fin', className: 'text-sm' },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const visual = getContractVisualStatus(c.endDate)
                  const cfg = contractStatusConfig[visual]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              { key: 'responsible', header: 'Responsable' },
              {
                key: 'actions',
                header: 'Acciones',
                render: (c) => (
                  <div className="flex items-center gap-1">
                    <TableActions
                      onView={() => setDialog({ publisherId: c.publisherId, mode: 'view' })}
                      onEdit={() => setDialog({ publisherId: c.publisherId, mode: 'edit' })}
                    />
                    <Button size="sm" variant="outline" onClick={() => openEdit(c.publisherId)}>
                      Renovar
                    </Button>
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
        title={dialog?.mode === 'edit' ? 'Editar Editorial' : 'Detalle de Editorial'}
        subtitle={selected?.name}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={handleSave}
        saveLabel="Guardar"
      >
        {selected && dialog?.mode === 'view' ? (
          <>
            <DetailRow label="Nombre" value={selected.name} />
            <DetailRow label="País" value={selected.country} />
            <DetailRow label="Contacto" value={selected.contact} />
            <DetailRow label="Teléfono" value={selected.phone} />
            <DetailRow label="Dirección" value={selected.address} />
            <DetailRow label="Tipo de Contrato" value={<Badge variant="gold">{selected.contractType}</Badge>} />
            <DetailRow label="Vencimiento" value={selected.contractExpiry} />
            <DetailRow
              label="Estado del contrato"
              value={
                <Badge variant={contractStatusConfig[getContractVisualStatus(selected.contractExpiry)].variant}>
                  {contractStatusConfig[getContractVisualStatus(selected.contractExpiry)].label}
                </Badge>
              }
            />
            <DetailRow label="Productos asociados" value={<span className="font-semibold text-corporate">{selected.productCount}</span>} />
            <DetailRow label="Estado" value={<Badge variant={selected.status === 'active' ? 'success' : 'neutral'}>{selected.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>} />
          </>
        ) : selected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="md:col-span-2" />
            <Input label="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input label="Contacto" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="Dirección" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="md:col-span-2" />
            <Select label="Tipo de Contrato" value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })} options={contractTypes.map((t) => ({ value: t, label: t }))} />
            <Input label="Vencimiento contrato" type="date" value={form.contractExpiry} onChange={(e) => setForm({ ...form, contractExpiry: e.target.value })} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={statusOptions} />
          </div>
        ) : null}
      </FormDialog>
    </div>
  )
}
