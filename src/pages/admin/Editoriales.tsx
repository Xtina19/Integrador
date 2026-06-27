import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Globe, FileText, BookMarked, Mail, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardBody, StatCard } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { FormDialog, DetailRow } from '../../components/ui/FormDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { adminPath } from '../../lib/adminConfig'
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

export function Editoriales() {
  const navigate = useNavigate()
  const { publishers, updatePublisher, deletePublisher } = useAdminCatalog()
  const [dialog, setDialog] = useState<{ id: string; mode: 'view' | 'edit' } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
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

  const selected = dialog ? publishers.find((p) => p.id === dialog.id) ?? null : null

  const stats = useMemo(() => {
    const totalProducts = publishers.reduce((sum, p) => sum + p.productCount, 0)
    const activeContracts = publishers.filter((p) => getContractVisualStatus(p.contractExpiry) === 'active').length
    const expiringSoon = publishers.filter((p) => getContractVisualStatus(p.contractExpiry) === 'expiring')
    const expiredContracts = publishers.filter((p) => getContractVisualStatus(p.contractExpiry) === 'expired').length

    return {
      totalPublishers: publishers.length,
      totalProducts,
      activeContracts,
      expiringCount: expiringSoon.length,
      expiredContracts,
      expiringSoon,
    }
  }, [publishers])

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
  }, [selected, dialog?.mode, dialog?.id])

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

  function openEdit(id: string) {
    setDialog({ id, mode: 'edit' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link to="/administracion" className="text-corporate hover:underline">Administración</Link>
          <span>/</span>
          <span>Editoriales</span>
          <span className="ml-2">— {stats.totalPublishers} registros</span>
        </div>
        <Button icon={Plus} onClick={() => navigate(adminPath('editoriales', 'nuevo'))}>
          Registrar Editorial
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Editoriales Registradas"
          value={stats.totalPublishers}
          detail="Catálogo maestro activo"
          icon={<BookMarked size={22} />}
        />
        <StatCard
          title="Productos Asociados"
          value={stats.totalProducts.toLocaleString()}
          detail="En catálogo"
          icon={<FileText size={22} />}
        />
        <StatCard
          title="Contratos Vigentes"
          value={stats.activeContracts}
          detail="Contratos activos"
          icon={<Globe size={22} />}
        />
        <StatCard
          title="Contratos por Vencer"
          value={stats.expiringCount}
          detail="Vencen en menos de 30 días"
          icon={<AlertTriangle size={22} />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-medium text-gray-700">Estado de contratos:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          Contrato Vigente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          Por vencer (&lt;30 días)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          Contrato Vencido
        </span>
      </div>

      <Card>
        <CardHeader title="Listado de Editoriales" subtitle="Catálogo maestro de editoriales y contratos" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={publishers}
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
              {
                key: 'contact',
                header: 'Correo',
                render: (p) => (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail size={10} className="shrink-0" />
                    {p.contact}
                  </span>
                ),
              },
              {
                key: 'country',
                header: 'País',
                render: (p) => (
                  <div className="flex items-center gap-1.5">
                    <Globe size={14} className="text-gray-400" />
                    <span>{p.country}</span>
                  </div>
                ),
              },
              { key: 'contractType', header: 'Tipo de Contrato', className: 'text-sm' },
              {
                key: 'productCount',
                header: 'Productos Asociados',
                render: (p) => <span className="font-semibold text-corporate">{p.productCount}</span>,
              },
              {
                key: 'contractStatus',
                header: 'Estado',
                render: (p) => {
                  const status = getContractVisualStatus(p.contractExpiry)
                  const config = contractStatusConfig[status]
                  return <Badge variant={config.variant}>{config.label}</Badge>
                },
              },
              {
                key: 'contractExpiry',
                header: 'Fecha de Vencimiento',
                render: (p) => {
                  const status = getContractVisualStatus(p.contractExpiry)
                  const colorClass =
                    status === 'expired'
                      ? 'text-red-600 font-medium'
                      : status === 'expiring'
                        ? 'text-amber-600 font-medium'
                        : 'text-gray-600'
                  return <span className={`text-sm ${colorClass}`}>{p.contractExpiry}</span>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (p) => (
                  <TableActions
                    onView={() => setDialog({ id: p.id, mode: 'view' })}
                    onEdit={() => setDialog({ id: p.id, mode: 'edit' })}
                    onDelete={() => setDeleteId(p.id)}
                  />
                ),
              },
            ]}
          />
        </CardBody>
      </Card>

      {stats.expiringSoon.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader
            title="Contratos Próximos a Vencer"
            subtitle="Editoriales con contratos que vencen en los próximos 30 días"
          />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={stats.expiringSoon}
              columns={[
                {
                  key: 'name',
                  header: 'Nombre Editorial',
                  render: (p) => <span className="font-medium text-gray-900">{p.name}</span>,
                },
                {
                  key: 'contractExpiry',
                  header: 'Fecha de vencimiento',
                  render: (p) => (
                    <span className="text-sm font-medium text-amber-600">{p.contractExpiry}</span>
                  ),
                },
                {
                  key: 'renew',
                  header: '',
                  render: (p) => (
                    <Button size="sm" variant="outline" onClick={() => openEdit(p.id)}>
                      Renovar
                    </Button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      <FormDialog
        open={Boolean(dialog && selected)}
        onClose={() => setDialog(null)}
        title={dialog?.mode === 'edit' ? 'Editar Editorial' : 'Detalle de Editorial'}
        subtitle={selected?.country}
        mode={dialog?.mode ?? 'view'}
        onEdit={() => setDialog((d) => (d ? { ...d, mode: 'edit' } : null))}
        onSave={handleSave}
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

      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return
          deletePublisher(deleteId)
          setDeleteId(null)
        }}
        message="¿Está seguro de eliminar esta editorial del catálogo?"
      />
    </div>
  )
}
