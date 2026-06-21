import { useState } from 'react'
import { Plus, ArrowRight, Truck, Clock, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { transfers, transferHistory, branches } from '../data/mockData'
import { transferRequests, transferApprovals, transferReceptions } from '../data/inventoryMockData'

type Tab = 'solicitudes' | 'aprobaciones' | 'transito' | 'recepcion' | 'historial'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'gold' }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  approved: { label: 'Aprobada', variant: 'info' },
  in_transit: { label: 'En tránsito', variant: 'info' },
  pending_receipt: { label: 'Por recibir', variant: 'gold' },
  received: { label: 'Recibida', variant: 'success' },
  completed: { label: 'Completada', variant: 'success' },
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'aprobaciones', label: 'Aprobaciones' },
  { id: 'transito', label: 'En Tránsito' },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'historial', label: 'Historial' },
]

export function Transfers() {
  const [activeTab, setActiveTab] = useState<Tab>('transito')
  const [showForm, setShowForm] = useState(false)

  const inTransit = transfers.filter((t) => t.status === 'in_transit' || t.status === 'pending_receipt')

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
                <p className="text-2xl font-bold text-corporate">{transferRequests.filter((t) => t.status === 'pending').length}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="Sucursal origen" options={branches.map((b) => ({ value: b.id, label: b.name }))} />
              <Select label="Sucursal destino" options={branches.map((b) => ({ value: b.id, label: b.name }))} />
              <Input label="Producto" placeholder="Buscar producto por ISBN o título..." />
              <Input label="Cantidad" type="number" placeholder="0" min={1} />
              <Select label="Método de transporte" options={[{ value: 'internal', label: 'Distribución interna' }, { value: 'own', label: 'Transporte propio' }]} />
              <div className="flex items-end"><Button className="w-full">Crear Solicitud</Button></div>
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
              data={transferRequests}
              columns={[
                { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs text-corporate">{t.id}</span> },
                { key: 'origin', header: 'Origen → Destino', render: (t) => <span>{t.origin} → {t.destination}</span> },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'date', header: 'Fecha' },
                { key: 'status', header: 'Estado', render: () => <Badge variant="warning">Pendiente</Badge> },
              ]}
            />
          </CardBody>
        </Card>
      )}

      {activeTab === 'aprobaciones' && (
        <Card>
          <CardHeader title="Aprobaciones" subtitle="Solicitudes aprobadas" />
          <CardBody className="!p-0">
            <Table
              keyField="id"
              data={transferApprovals}
              columns={[
                { key: 'id', header: 'Solicitud' },
                { key: 'origin', header: 'Ruta', render: (t) => <span>{t.origin} → {t.destination}</span> },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'approvedBy', header: 'Aprobado por' },
                { key: 'date', header: 'Fecha' },
                { key: 'status', header: 'Estado', render: () => <Badge variant="success">Aprobada</Badge> },
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
              data={transfers}
              columns={[
                { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs text-corporate">{t.id}</span> },
                { key: 'origin', header: 'Origen → Destino', render: (t) => <div className="flex items-center gap-2 text-sm"><span>{t.origin}</span><ArrowRight size={14} className="text-gold-dark" /><span className="font-medium">{t.destination}</span></div> },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad', render: (t) => <span className="font-semibold">{t.qty}</span> },
                { key: 'status', header: 'Estado', render: (t) => { const s = statusConfig[t.status]; return <Badge variant={s.variant}>{s.label}</Badge> } },
                { key: 'transport', header: 'Transporte', className: 'text-xs text-gray-500' },
                { key: 'date', header: 'Fecha', className: 'text-xs text-gray-400' },
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
              data={transferReceptions}
              columns={[
                { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs text-corporate">{t.id}</span> },
                { key: 'origin', header: 'Ruta', render: (t) => <span>{t.origin} → {t.destination}</span> },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'receivedBy', header: 'Recibido por' },
                { key: 'date', header: 'Fecha' },
                { key: 'status', header: 'Estado', render: () => <Badge variant="success">Recibida</Badge> },
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
              data={transferHistory}
              columns={[
                { key: 'id', header: 'ID', className: 'text-xs text-gray-400' },
                { key: 'origin', header: 'Ruta', render: (t) => <span>{t.origin} → {t.destination}</span> },
                { key: 'product', header: 'Producto' },
                { key: 'qty', header: 'Cantidad' },
                { key: 'status', header: 'Estado', render: () => <Badge variant="success">Completada</Badge> },
                { key: 'date', header: 'Fecha', className: 'text-xs text-gray-400' },
              ]}
            />
          </CardBody>
        </Card>
      )}
    </div>
  )
}
