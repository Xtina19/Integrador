import { useState, useMemo } from 'react'
import { Plus, ArrowRight, Truck, Clock, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { branches } from '../data/mockData'
import { transferStatusLabels } from '../business-rules/stateMachines'
import type { TransferStatus } from '../types/domain'
import { useERP } from '../store/ERPProvider'
import { validateTransfer } from '../business-rules/validators'
import { trim } from '../utils/formValidation'
import { useGlobalSearchRecordEffect, useRecordHighlightScroll } from '../context/GlobalSearchNavigationContext'

type Tab = 'solicitudes' | 'aprobaciones' | 'transito' | 'recepcion' | 'historial'

const statusVariants: Record<TransferStatus, 'success' | 'warning' | 'danger' | 'info' | 'gold'> = {
  requested: 'warning',
  approved: 'info',
  in_transit: 'info',
  received: 'gold',
  finalized: 'success',
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'aprobaciones', label: 'Aprobaciones' },
  { id: 'transito', label: 'En Tránsito' },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'historial', label: 'Historial' },
]

export function Transfers() {
  const {
    state,
    createTransfer,
    approveTransfer,
    shipTransfer,
    receiveTransfer,
    finalizeTransfer,
  } = useERP()
  const { transfers, transferHistory, products } = state

  const [activeTab, setActiveTab] = useState<Tab>('transito')
  const [showForm, setShowForm] = useState(false)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  useGlobalSearchRecordEffect('transfer', {
    onHighlight: (recordId) => {
      const t = transfers.find((x) => x.id === recordId)
      const inHistory = transferHistory.some((x) => x.id === recordId)
      if (inHistory) setActiveTab('historial')
      else if (t?.status === 'requested') setActiveTab('solicitudes')
      else if (t?.status === 'approved') setActiveTab('aprobaciones')
      else if (t?.status === 'in_transit') setActiveTab('transito')
      else if (t?.status === 'received') setActiveTab('recepcion')
      else setActiveTab('transito')
      setHighlightId(recordId)
    },
  })
  useRecordHighlightScroll(highlightId)
  const [form, setForm] = useState({
    origin: branches[0]?.name ?? '',
    destination: branches[1]?.name ?? '',
    product: products[0]?.title ?? '',
    qty: '1',
    transport: 'Distribución interna',
  })
  const [formError, setFormError] = useState('')

  const transferValidation = useMemo(() => validateTransfer(form), [form])

  const requested = transfers.filter((t) => t.status === 'requested')
  const approved = transfers.filter((t) => t.status === 'approved')
  const inTransit = transfers.filter((t) => t.status === 'in_transit')
  const toReceive = transfers.filter((t) => t.status === 'received')

  function handleCreate() {
    if (!transferValidation.valid) {
      setFormError(transferValidation.errors[0])
      return
    }
    const result = createTransfer({
      origin: trim(form.origin),
      destination: trim(form.destination),
      product: trim(form.product),
      qty: Number(form.qty) || 1,
      transport: trim(form.transport),
    })
    if (result.success) {
      setShowForm(false)
      setActiveTab('solicitudes')
      setFormError('')
    } else {
      setFormError(result.errors?.[0] ?? 'Error al crear la solicitud')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-corporate">{requested.length}</p>
                <p className="text-xs text-gray-500">Solicitudes pendientes</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Truck size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-corporate">{inTransit.length}</p>
                <p className="text-xs text-gray-500">En tránsito</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-corporate">{transferHistory.length}</p>
                <p className="text-xs text-gray-500">Completadas este mes</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'bg-corporate text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button icon={Plus} onClick={() => setShowForm(!showForm)}>Nueva Solicitud</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Nueva Solicitud de Transferencia" subtitle="Distribución interna entre sucursales" />
          <CardBody>
            {formError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Sucursal origen"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                options={branches.map((b) => ({ value: b.name, label: b.name }))}
              />
              <Select
                label="Sucursal destino"
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                options={branches.map((b) => ({ value: b.name, label: b.name }))}
              />
              <Select
                label="Producto"
                value={form.product}
                onChange={(e) => setForm({ ...form, product: e.target.value })}
                options={products.map((p) => ({ value: p.title, label: p.title }))}
              />
              <Input label="Cantidad" type="number" min={1} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
              <Select
                label="Método de transporte"
                value={form.transport}
                onChange={(e) => setForm({ ...form, transport: e.target.value })}
                options={[
                  { value: 'Distribución interna', label: 'Distribución interna' },
                  { value: 'Transporte propio', label: 'Transporte propio' },
                ]}
              />
              <div className="flex items-end"><Button className="w-full" onClick={handleCreate} disabled={!transferValidation.valid}>Crear Solicitud</Button></div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'solicitudes' && (
        <Card>
          <CardHeader title="Solicitudes de Transferencia" subtitle="Pendientes de aprobación" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              highlightId={highlightId}
              data={requested as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs text-corporate">{(t as { id: string }).id}</span> },
                { key: 'origin', header: 'Origen → Destino', render: (t) => { const x = t as { origin: string; destination: string }; return <span>{x.origin} → {x.destination}</span> } },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'date', header: 'Fecha' },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (t) => (
                    <Button size="sm" onClick={() => approveTransfer((t as { id: string }).id)}>Aprobar</Button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'aprobaciones' && (
        <Card>
          <CardHeader title="Aprobaciones" subtitle="Listas para despacho" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              highlightId={highlightId}
              data={approved as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'id', header: 'Solicitud' },
                { key: 'origin', header: 'Ruta', render: (t) => { const x = t as { origin: string; destination: string }; return <span>{x.origin} → {x.destination}</span> } },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'date', header: 'Fecha' },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (t) => (
                    <Button size="sm" variant="outline" onClick={() => shipTransfer((t as { id: string }).id)}>Despachar</Button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'transito' && (
        <Card>
          <CardHeader title="En Tránsito" subtitle="Movimientos activos" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              highlightId={highlightId}
              data={inTransit as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs text-corporate">{(t as { id: string }).id}</span> },
                { key: 'origin', header: 'Origen → Destino', render: (t) => { const x = t as { origin: string; destination: string }; return <div className="flex items-center gap-2 text-sm"><span>{x.origin}</span><ArrowRight size={14} className="text-gold-dark" /><span className="font-medium">{x.destination}</span></div> } },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad', render: (t) => <span className="font-semibold">{(t as { qty: number }).qty}</span> },
                { key: 'status', header: 'Estado', render: (t) => { const s = (t as { status: TransferStatus }).status; return <Badge variant={statusVariants[s]}>{transferStatusLabels[s]}</Badge> } },
                { key: 'transport', header: 'Transporte', className: 'text-xs text-gray-500' },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (t) => (
                    <Button size="sm" onClick={() => receiveTransfer((t as { id: string }).id)}>Recibir</Button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'recepcion' && (
        <Card>
          <CardHeader title="Recepción de Transferencias" subtitle="Confirmación en destino" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              highlightId={highlightId}
              data={toReceive as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'id', header: 'ID' },
                { key: 'origin', header: 'Ruta', render: (t) => { const x = t as { origin: string; destination: string }; return <span>{x.origin} → {x.destination}</span> } },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'date', header: 'Fecha' },
                {
                  key: 'actions',
                  header: 'Acciones',
                  render: (t) => (
                    <Button size="sm" onClick={() => finalizeTransfer((t as { id: string }).id)}>Finalizar</Button>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'historial' && (
        <Card>
          <CardHeader title="Historial de Movimientos" subtitle="Transferencias completadas" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              highlightId={highlightId}
              data={transferHistory as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'id', header: 'ID', className: 'text-xs text-gray-400' },
                { key: 'origin', header: 'Ruta', render: (t) => { const x = t as { origin: string; destination: string }; return <span>{x.origin} → {x.destination}</span> } },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'status', header: 'Estado', render: () => <Badge variant="success">Finalizada</Badge> },
                { key: 'date', header: 'Fecha', className: 'text-xs text-gray-400' },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
