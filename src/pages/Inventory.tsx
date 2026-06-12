import { useState, useMemo } from 'react'
import { Plus, Search, Filter, Download, MapPin } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { Table } from '../components/ui/Table'
import { products, categories } from '../data/mockData'

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  normal: { label: 'Normal', variant: 'success' },
  low: { label: 'Bajo stock', variant: 'warning' },
  out: { label: 'Agotado', variant: 'danger' },
}

export function Inventory() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.isbn.includes(search) ||
        p.author.toLowerCase().includes(search.toLowerCase())
      const matchCategory = category === 'all' || p.category === category
      const matchStatus = status === 'all' || p.status === status
      return matchSearch && matchCategory && matchStatus
    })
  }, [search, category, status])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {filtered.length} productos encontrados de {products.length} en catálogo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download}>Exportar</Button>
          <Button icon={Plus}>Agregar Producto</Button>
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                icon={Search}
                placeholder="Buscar por título, ISBN o autor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              label="Categoría"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: 'all', label: 'Todas las categorías' },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
            <Select
              label="Estado de stock"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'normal', label: 'Normal' },
                { value: 'low', label: 'Bajo stock' },
                { value: 'out', label: 'Agotado' },
              ]}
            />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">Filtros activos:</span>
            {category !== 'all' && <Badge variant="gold">{category}</Badge>}
            {status !== 'all' && <Badge variant="gold">{statusMap[status]?.label}</Badge>}
            {search && <Badge variant="gold">"{search}"</Badge>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Catálogo de Productos" subtitle="Inventario compartido multisucursal" />
        <CardBody className="!p-0">
          <Table
            keyField="id"
            data={filtered}
            columns={[
              { key: 'isbn', header: 'ISBN', className: 'text-xs font-mono text-gray-500' },
              {
                key: 'title',
                header: 'Título',
                render: (p) => (
                  <div>
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.author}</p>
                  </div>
                ),
              },
              { key: 'category', header: 'Categoría', render: (p) => <Badge variant="neutral">{p.category}</Badge> },
              { key: 'publisher', header: 'Editorial' },
              {
                key: 'stock',
                header: 'Stock',
                render: (p) => <span className="font-semibold text-corporate">{p.stock}</span>,
              },
              {
                key: 'location',
                header: 'Ubicación',
                render: (p) => (
                  <div className="flex items-center gap-1.5 text-xs">
                    <MapPin size={12} className="text-gold-dark shrink-0" />
                    <span>{p.location}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (p) => {
                  const s = statusMap[p.status]
                  return <Badge variant={s.variant}>{s.label}</Badge>
                },
              },
            ]}
          />
        </CardBody>
      </Card>
    </div>
  )
}
