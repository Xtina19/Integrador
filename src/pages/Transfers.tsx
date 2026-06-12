import { useState } from 'react'
import { Plus, ArrowRight, Truck, Clock, CheckCircle, Package } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { transfers, transferHistory, branches } from '../data/mockData'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'gold'; icon: typeof Clock }> = {
  pending: { label: 'Pendiente', variant: 'warning', icon: Clock },
  in_transit: { label: 'En tránsito', variant: 'info', icon: Truck },
  pending_receipt: { label: 'Por recibir', variant: 'gold', icon: Package },
  completed: { label: 'Completada', variant: 'success', icon: CheckCircle },
}

export function Transfers() {
  const [showForm, setShowForm] = useState(false)

  const activeTransfers = transfers.filter((t) => t.status !== 'completed')
  const completedCount = transfers.filter((t) => t.status === 'completed').length + transferHistory.length

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
                <p className="text-2xl font-bold text-corporate">{activeTransfers.length}</p>
                <p className="text-xs text-gray-500">Transferencias activas</p>
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
                <p className="text-2xl font-bold text-corporate">
                  {transfers.filter((t) => t.status === 'in_transit').length}
                </p>
                <p className="text-xs text-gray-500">En transporte propio</p>
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
                <p className="text-2xl font-bold text-corporate">{completedCount}</p>
                <p className="text-xs text-gray-500">Completadas este mes</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => setShowForm(!showForm)}>
          Nueva Transferencia
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Nueva Transferencia" subtitle="Distribución interna entre sucursales" />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select
                label="Sucursal origen"
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
              <Select
                label="Sucursal destino"
                options={branches.map((b) => ({ value: b.id, label: b.name }))}
              />
              <Input label="Producto" placeholder="Buscar producto por ISBN o título..." />
              <Input label="Cantidad" type="number" placeholder="0" min={1} />
              <Select
                label="Método de transporte"
                options={[
                  { value: 'internal', label: 'Distribución interna' },
                  { value: 'own', label: 'Transporte propio' },
                ]}
              />
              <div className="flex items-end">
                <Button className="w-full">Crear Transferencia</Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Transferencias Activas" subtitle="Movimientos en curso" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={transfers}
            columns={[
              { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs font-medium text-corporate">{t.id}</span> },
              {
                key: 'origin',
                header: 'Origen → Destino',
                render: (t) => (
                  <div className="flex items-center gap-2 text-sm">
                    <span>{t.origin}</span>
                    <ArrowRight size={14} className="text-gold-dark" />
                    <span className="font-medium">{t.destination}</span>
                  </div>
                ),
              },
              { key: 'product', header: 'Producto' },
              { key: 'qty', header: 'Cantidad', render: (t) => <span className="font-semibold">{t.qty}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (t) => {
                  const s = statusConfig[t.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
              { key: 'transport', header: 'Transporte', className: 'text-xs text-gray-500' },
              { key: 'date', header: 'Fecha', className: 'text-xs text-gray-400' },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Historial de Movimientos" subtitle="Transferencias completadas recientemente" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={transferHistory}
            columns={[
              { key: 'id', header: 'ID', render: (t) => <span className="font-mono text-xs text-gray-400">{t.id}</span> },
              {
                key: 'origin',
                header: 'Ruta',
                render: (t) => (
                  <span className="text-sm">{t.origin} → {t.destination}</span>
                ),
              },
              { key: 'product', header: 'Producto' },
              { key: 'qty', header: 'Cantidad' },
              {
                key: 'status',
                header: 'Estado',
                render: () => <Badge variant="success">Completada</Badge>,
              },
              { key: 'date', header: 'Fecha', className: 'text-xs text-gray-400' },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
