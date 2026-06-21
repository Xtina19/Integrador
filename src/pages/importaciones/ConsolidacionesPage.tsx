import { useState, useMemo } from 'react'
import { Layers } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { consolidations } from '../../data/importsMockData'

const consolidationStatusMap: Record<string, { label: string; variant: 'success' | 'neutral' }> = {
  active: { label: 'Activa', variant: 'success' },
  closed: { label: 'Cerrada', variant: 'neutral' },
}

export function ConsolidacionesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return consolidations.filter((c) => {
      const matchSearch =
        search === '' ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || c.status === statusFilter
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
            searchPlaceholder="Buscar por código o nombre..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Activa' },
                  { value: 'closed', label: 'Cerrada' },
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [consolidationStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Consolidaciones" subtitle={`${filtered.length} consolidaciones registradas`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'id',
                header: 'Código',
                render: (c) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Layers size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{c.id}</span>
                  </div>
                ),
              },
              { key: 'name', header: 'Nombre', render: (c) => <span className="font-medium">{c.name}</span> },
              { key: 'orders', header: 'Órdenes', render: (c) => <span className="font-semibold">{c.orders}</span> },
              { key: 'shipments', header: 'Embarques', render: (c) => <span className="font-semibold">{c.shipments}</span> },
              { key: 'totalBoxes', header: 'Total cajas', render: (c) => <span className="font-semibold text-corporate">{c.totalBoxes}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (c) => {
                  const cfg = consolidationStatusMap[c.status]
                  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
                },
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: () => <TableActions onView={() => {}} />,
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
