import { useState, useMemo } from 'react'
import { DollarSign } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { TableActions } from '../../components/ui/TableActions'
import { Toolbar } from '../../components/ui/Toolbar'
import { freightCosts } from '../../data/importsMockData'

function formatCurrency(value: number) {
  return `RD$${value.toLocaleString()}`
}

export function CostosFletePage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return freightCosts.filter(
      (c) =>
        search === '' ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.shipment.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por código o embarque..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Costos de Flete" subtitle={`${filtered.length} registros de costos`} />
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
                      <DollarSign size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{c.id}</span>
                  </div>
                ),
              },
              { key: 'shipment', header: 'Embarque', render: (c) => <span className="font-mono text-xs">{c.shipment}</span> },
              { key: 'freight', header: 'Flete', render: (c) => <span className="text-sm">{formatCurrency(c.freight)}</span> },
              { key: 'insurance', header: 'Seguro', render: (c) => <span className="text-sm">{formatCurrency(c.insurance)}</span> },
              { key: 'customs', header: 'Aduana', render: (c) => <span className="text-sm">{formatCurrency(c.customs)}</span> },
              { key: 'other', header: 'Otros', render: (c) => <span className="text-sm">{formatCurrency(c.other)}</span> },
              { key: 'total', header: 'Total', render: (c) => <span className="font-semibold text-corporate">{formatCurrency(c.total)}</span> },
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
