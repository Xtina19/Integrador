import { useState, useMemo } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Input'
import { adminProducts, publisherNames } from '@/mocks/mockAdmin'
import { formatDop } from '@/lib/money'

export function ProductosAsociadosPage() {
  const [search, setSearch] = useState('')
  const [publisher, setPublisher] = useState('all')

  const filtered = useMemo(() => {
    return adminProducts.filter((p) => {
      const matchSearch = search === '' || p.title.toLowerCase().includes(search.toLowerCase()) || p.isbn.includes(search)
      const matchPublisher = publisher === 'all' || p.publisher === publisher
      return matchSearch && matchPublisher
    })
  }, [search, publisher])

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por título o ISBN..."
            filters={
              <Select
                label="Editorial"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                options={[{ value: 'all', label: 'Todas' }, ...publisherNames.map((n) => ({ value: n, label: n }))]}
              />
            }
            activeFilters={publisher !== 'all' ? [publisher] : []}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Productos Asociados" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'code', header: 'Código', render: (p) => <span className="font-mono text-xs text-corporate">{p.code}</span> },
              { key: 'isbn', header: 'ISBN', className: 'text-xs font-mono text-gray-500' },
              { key: 'title', header: 'Título', render: (p) => <span className="font-medium">{p.title}</span> },
              { key: 'author', header: 'Autor', className: 'text-sm text-gray-500' },
              { key: 'publisher', header: 'Editorial', render: (p) => <Badge variant="neutral">{p.publisher}</Badge> },
              { key: 'category', header: 'Categoría' },
              { key: 'price', header: 'Precio', render: (p) => <span className="font-semibold text-corporate tabular-nums">{formatDop(p.price)}</span> },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
