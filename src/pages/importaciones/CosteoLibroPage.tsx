import { useState, useMemo } from 'react'
import { Calculator } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Toolbar } from '../../components/ui/Toolbar'
import { bookCosting } from '../../data/importsMockData'

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`
}

export function CosteoLibroPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return bookCosting.filter(
      (b) =>
        search === '' ||
        b.isbn.includes(search) ||
        b.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por ISBN o título..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Costeo por Libro" subtitle={`${filtered.length} libros costeados`} />
        <CardBody className="!p-0">
          <Table
            keyField="isbn"
            data={filtered}
            columns={[
              {
                key: 'isbn',
                header: 'ISBN',
                render: (b) => (
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-corporate/10 flex items-center justify-center shrink-0">
                      <Calculator size={16} className="text-corporate" />
                    </div>
                    <span className="font-mono text-xs text-corporate">{b.isbn}</span>
                  </div>
                ),
              },
              { key: 'title', header: 'Título', render: (b) => <span className="font-medium">{b.title}</span> },
              { key: 'productCost', header: 'Costo producto', render: (b) => <span className="text-sm">{formatUsd(b.productCost)}</span> },
              { key: 'freightAlloc', header: 'Flete asignado', render: (b) => <span className="text-sm">{formatUsd(b.freightAlloc)}</span> },
              { key: 'finalCost', header: 'Costo final', render: (b) => <span className="font-semibold text-corporate">{formatUsd(b.finalCost)}</span> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
