import { useState, useMemo } from 'react'
import { PackageCheck } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { receptions } from '../../data/purchasesMockData'

const receptionStatusMap: Record<string, { label: string; variant: 'success' | 'warning' }> = {
  complete: { label: 'Completa', variant: 'success' },
  pending: { label: 'Pendiente', variant: 'warning' },
}

export function RecepcionesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return receptions.filter((r) => {
      const matchSearch =
        search === '' ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.orderId.toLowerCase().includes(search.toLowerCase()) ||
        r.supplier.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por recepción, orden o proveedor..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'complete', label: 'Completa' },
                  { value: 'pending', label: 'Pendiente' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [receptionStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recepciones de Mercancía" subtitle={`${filtered.length} recepciones registradas`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'id',
                header: 'Recepción',
                render: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <PackageCheck size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{r.id}</span>
                  </div>
                ),
              },
              { key: 'orderId', header: 'Orden de Compra', render: (r) => <span className="font-mono text-xs">{r.orderId}</span> },
              { key: 'supplier', header: 'Proveedor', render: (r) => <span className="font-medium">{r.supplier}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'items', header: 'Ítems recibidos', render: (r) => <span className="font-semibold">{r.items}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (r) => {
                  const cfg = receptionStatusMap[r.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => <TableActions onView={() => {}} onEdit={() => {}} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
