import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Ship } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { Select } from '../../components/ui/Input'
import { shipments, shipmentStatusMap } from '../../data/importsMockData'

export function EmbarquesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const matchSearch =
        search === '' ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.origin.toLowerCase().includes(search.toLowerCase()) ||
        s.destination.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || s.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => navigate('/importaciones/embarques/nuevo')}>Registrar Embarque</Button>
      </div>

      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código, origen o destino..."
            filters={
              <Select
                label="Estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos' },
                  ...Object.entries(shipmentStatusMap).map(([value, cfg]) => ({ value, label: cfg.label })),
                ]}
              />
            }
            activeFilters={statusFilter !== 'all' ? [shipmentStatusMap[statusFilter]?.label ?? statusFilter] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Embarques Internacionales" subtitle={`${filtered.length} embarques registrados`} />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              {
                key: 'code',
                header: 'Código',
                render: (s) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Ship size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{s.code}</span>
                  </div>
                ),
              },
              { key: 'type', header: 'Tipo de transporte' },
              { key: 'origin', header: 'Origen', className: 'text-sm' },
              { key: 'destination', header: 'Destino', className: 'text-sm' },
              { key: 'departure', header: 'Salida', className: 'text-sm' },
              { key: 'arrival', header: 'Llegada', className: 'text-sm' },
              { key: 'boxes', header: 'Cajas', render: (s) => <span className="font-semibold">{s.boxes}</span> },
              {
                key: 'status',
                header: 'Estado',
                render: (s) => {
                  const cfg = shipmentStatusMap[s.status]
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

