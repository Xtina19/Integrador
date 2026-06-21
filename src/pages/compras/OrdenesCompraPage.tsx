import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { purchaseOrders, purchaseStatusMap } from '../../data/purchasesMockData'

export function OrdenesCompraPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return purchaseOrders.filter((o) => {
      const matchSearch =
        search === '' ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.supplier.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate('/compras/ordenes/nuevo')}>Nueva Orden de Compra</Button>
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código o proveedor..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  ...Object.entries(purchaseStatusMap).map(([value, cfg]) => ({ value, label: cfg.label })),
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [purchaseStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Órdenes de Compra" subtitle={`${filtered.length} órdenes registradas`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'id',
                header: 'Código',
                render: (o) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <ShoppingCart size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{o.id}</span>
                  </div>
                ),
              },
              { key: 'supplier', header: 'Proveedor', render: (o) => <span className="font-medium">{o.supplier}</span> },
              { key: 'date', header: 'Fecha', className: 'text-sm' },
              { key: 'items', header: 'Ítems', render: (o) => <span className="font-semibold">{o.items}</span> },
              { key: 'total', header: 'Total', render: (o) => <span className="font-semibold text-corporate">RD${o.total.toLocaleString()}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (o) => {
                  const cfg = purchaseStatusMap[o.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => <TableActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}

